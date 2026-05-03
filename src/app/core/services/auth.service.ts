import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  AuthMeResponse,
  AuthResponse,
  CurrentUser,
  JwtPayload,
  LoginRequest,
  RefreshResponse,
  RegisterRequest
} from '../models/auth.model';

const ACCESS_KEY = 'gf_access_token';
const REFRESH_KEY = 'gf_refresh_token';
const USER_KEY = 'gf_current_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private _isAuthenticated$ = new BehaviorSubject<boolean>(this.hasValidToken());
  private _currentUser$ = new BehaviorSubject<CurrentUser | null>(this.decodeCurrentUser());

  readonly isAuthenticated$ = this._isAuthenticated$.asObservable();
  readonly currentUser$ = this._currentUser$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.syncCurrentUserIfNeeded();
  }

  register(data: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    const payload = {
      login: credentials.usuario,
      password: credentials.senha
    };

    return this.http.post<unknown>(`${this.apiUrl}/login`, payload).pipe(
      map((response) => this.normalizeAuthResponse(response)),
      tap((res) => this.storeTokens(res)),
      catchError((err) => throwError(() => err))
    );
  }

  refresh(): Observable<RefreshResponse> {
    const refreshToken = this.getItem(REFRESH_KEY);
    if (!refreshToken) return throwError(() => new Error('Sem refresh token'));

    return this.http.post<unknown>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      map((response) => this.normalizeRefreshResponse(response)),
      tap((res) => {
        this.setItem(ACCESS_KEY, res.accessToken);
        this._isAuthenticated$.next(true);
        this._currentUser$.next(this.decodeCurrentUser(res.accessToken));
        this.syncCurrentUserIfNeeded(true);
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  logout(): void {
    this.removeItem(ACCESS_KEY);
    this.removeItem(REFRESH_KEY);
    this.removeItem(USER_KEY);
    this._isAuthenticated$.next(false);
    this._currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  getAccessToken(): string | null {
    return this.getItem(ACCESS_KEY);
  }

  isTokenExpired(token?: string): boolean {
    const t = token ?? this.getAccessToken();
    if (!t) return true;

    try {
      const payload = this.decodeJwt(t);
      return payload.exp * 1000 - Date.now() < 30_000;
    } catch {
      return true;
    }
  }

  getRefreshToken(): string | null {
    return this.getItem(REFRESH_KEY);
  }

  private getItem(key: string): string | null {
    return this.isBrowser ? localStorage.getItem(key) : null;
  }

  private setItem(key: string, value: string): void {
    if (this.isBrowser) localStorage.setItem(key, value);
  }

  private removeItem(key: string): void {
    if (this.isBrowser) localStorage.removeItem(key);
  }

  private storeTokens(res: AuthResponse): void {
    this.setItem(ACCESS_KEY, res.accessToken);
    if (res.refreshToken) {
      this.setItem(REFRESH_KEY, res.refreshToken);
    }
    this.storeCurrentUser(res);
    this._isAuthenticated$.next(true);
    this._currentUser$.next(this.decodeCurrentUser(res.accessToken));
  }

  private storeCurrentUser(res: AuthResponse | AuthMeResponse): void {
    const role = this.readRoleFromResponse(res);
    if (!role) return;

    const user: CurrentUser = {
      userId: res.userId ?? null,
      colaboradorId: res.colaboradorId ?? null,
      username: res.username ?? res.email ?? '',
      email: res.email ?? res.username ?? '',
      role
    };

    this.setItem(USER_KEY, JSON.stringify(user));
  }

  private syncCurrentUserIfNeeded(force = false): void {
    if (!this.isBrowser || !this.hasValidToken()) return;

    const storedUser = this.readStoredUser();
    const needsSync = force
      || !storedUser?.userId
      || !storedUser?.username
      || (storedUser?.role === 'ROLE_COLABORADOR' && !storedUser?.colaboradorId);

    if (!needsSync) return;

    this.http.get<AuthMeResponse>(`${this.apiUrl}/me`).subscribe({
      next: (user) => {
        this.storeCurrentUser(user);
        this._currentUser$.next(this.decodeCurrentUser());
      },
      error: () => {
        // Mantem o estado atual; falhas aqui serao tratadas pelo fluxo normal de auth.
      }
    });
  }

  private hasValidToken(): boolean {
    if (!this.isBrowser) return false;
    const token = localStorage.getItem(ACCESS_KEY);
    return !!token && !this.isTokenExpired(token);
  }

  private decodeCurrentUser(token?: string): CurrentUser | null {
    const t = token ?? this.getItem(ACCESS_KEY);
    if (!t) return this.readStoredUser();

    try {
      const payload = this.decodeJwt(t);
      const persistedUser = this.readStoredUser();
      const role = this.readRole(payload) ?? persistedUser?.role ?? 'ROLE_COLABORADOR';

      return {
        userId: persistedUser?.userId ?? null,
        colaboradorId: persistedUser?.colaboradorId ?? null,
        username: persistedUser?.username ?? payload.sub,
        email: persistedUser?.email ?? payload.sub,
        role
      };
    } catch {
      return this.readStoredUser();
    }
  }

  private readStoredUser(): CurrentUser | null {
    const raw = this.getItem(USER_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw) as CurrentUser;
    } catch {
      return null;
    }
  }

  private readRole(payload: JwtPayload): CurrentUser['role'] | null {
    if (payload.role === 'ROLE_ADMIN' || payload.role === 'ROLE_COLABORADOR') {
      return payload.role;
    }

    if (typeof payload.roles === 'string') {
      const roles = payload.roles.split(',').map((role) => role.trim());
      if (roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
      if (roles.includes('ROLE_COLABORADOR')) return 'ROLE_COLABORADOR';
    }

    return null;
  }

  private readRoleFromResponse(res: Pick<AuthResponse, 'roles'>): CurrentUser['role'] | null {
    if (Array.isArray(res.roles)) {
      if (res.roles.includes('ROLE_ADMIN')) return 'ROLE_ADMIN';
      if (res.roles.includes('ROLE_COLABORADOR')) return 'ROLE_COLABORADOR';
    }

    return null;
  }

  private decodeJwt(token: string): JwtPayload {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json) as JwtPayload;
  }

  private normalizeAuthResponse(response: unknown): AuthResponse {
    const source = this.unwrapResponseObject(response);
    const accessToken = this.readString(source, ['accessToken', 'token', 'jwt', 'access_token']);
    const refreshToken = this.readString(source, ['refreshToken', 'refresh_token']) ?? '';
    const username = this.readString(source, ['username', 'login', 'userName']);
    const email = this.readString(source, ['email']);
    const roles = this.readRoles(source);

    if (!accessToken) {
      console.error('Resposta inesperada no login', response);
      throw new Error('Resposta de autenticacao invalida: accessToken nao encontrado.');
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.readNumber(source, ['expiresIn', 'expires_in']) ?? 0,
      userId: this.readString(source, ['userId', 'id']),
      colaboradorId: this.readString(source, ['colaboradorId']),
      username: username ?? undefined,
      email: email ?? undefined,
      roles: roles ?? undefined
    };
  }

  private normalizeRefreshResponse(response: unknown): RefreshResponse {
    const source = this.unwrapResponseObject(response);
    const accessToken = this.readString(source, ['accessToken', 'token', 'jwt', 'access_token']);

    if (!accessToken) {
      console.error('Resposta inesperada no refresh', response);
      throw new Error('Resposta de refresh invalida: accessToken nao encontrado.');
    }

    return {
      accessToken,
      expiresIn: this.readNumber(source, ['expiresIn', 'expires_in']) ?? 0
    };
  }

  private unwrapResponseObject(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const source = payload as Record<string, unknown>;
    const nested = source['data'];
    if (nested && typeof nested === 'object') {
      return nested as Record<string, unknown>;
    }

    return source;
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }
    return null;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
      }
      if (typeof value === 'string' && value.trim() && Number.isFinite(Number(value))) {
        return Number(value);
      }
    }
    return null;
  }

  private readRoles(source: Record<string, unknown>): string[] | null {
    const raw = source['roles'] ?? source['authorities'];

    if (Array.isArray(raw)) {
      return raw.filter((item): item is string => typeof item === 'string' && !!item.trim());
    }

    if (typeof raw === 'string' && raw.trim()) {
      return raw.split(',').map((role) => role.trim()).filter(Boolean);
    }

    return null;
  }
}
