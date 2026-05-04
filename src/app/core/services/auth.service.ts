import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, finalize } from 'rxjs/operators';

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

/**
 * Serviço de Autenticação Centralizado.
 * Responsável por: Login, Logout, Gestão de Tokens, Refresh e Estado do Usuário.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  // BehaviorSubjects para manter o estado reativo da aplicação
  private _isAuthenticated$ = new BehaviorSubject<boolean>(this.hasValidToken());
  private _currentUser$ = new BehaviorSubject<CurrentUser | null>(this.decodeCurrentUser());

  readonly isAuthenticated$ = this._isAuthenticated$.asObservable();
  readonly currentUser$ = this._currentUser$.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    // Sincroniza os dados do usuário com o servidor ao inicializar, se logado
    this.syncCurrentUserIfNeeded();
  }

  /**
   * Realiza o cadastro de um novo colaborador.
   */
  register(data: RegisterRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  /**
   * Realiza o login e armazena os tokens.
   */
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

  /**
   * Renova o token de acesso usando o refresh token.
   */
  refresh(): Observable<RefreshResponse> {
    const refreshToken = this.getItem(REFRESH_KEY);
    if (!refreshToken) {
      this.logout();
      return throwError(() => new Error('Sessão expirada. Por favor, faça login novamente.'));
    }

    return this.http.post<unknown>(`${this.apiUrl}/refresh`, { refreshToken }).pipe(
      map((response) => this.normalizeRefreshResponse(response)),
      tap((res) => {
        this.setItem(ACCESS_KEY, res.accessToken);
        this._isAuthenticated$.next(true);
        // Atualiza o usuário com base no novo token
        const updatedUser = this.decodeCurrentUser(res.accessToken);
        this._currentUser$.next(updatedUser);
        this.syncCurrentUserIfNeeded(true);
      }),
      catchError((err) => {
        this.logout();
        return throwError(() => err);
      })
    );
  }

  /**
   * Limpa os dados de sessão e redireciona para o login.
   */
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

  getRefreshToken(): string | null {
    return this.getItem(REFRESH_KEY);
  }

  /**
   * Verifica se o token está expirado ou próximo de expirar (margem de 30s).
   */
  isTokenExpired(token?: string): boolean {
    const t = token ?? this.getAccessToken();
    if (!t) return true;

    try {
      const payload = this.decodeJwt(t);
      const now = Math.floor(Date.now() / 1000);
      return (payload.exp - now) < 30; // Expira se faltar menos de 30 segundos
    } catch {
      return true;
    }
  }

  // --- Métodos Privados de Suporte ---

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

  /**
   * Busca dados atualizados do usuário no servidor para garantir consistência (ex: ID do Colaborador).
   */
  private syncCurrentUserIfNeeded(force = false): void {
    if (!this.isBrowser || !this.hasValidToken()) return;

    const storedUser = this.readStoredUser();
    // Só sincroniza se for forçado ou se faltarem dados essenciais
    const needsSync = force
      || !storedUser?.userId
      || !storedUser?.username
      || (storedUser?.role === 'ROLE_COLABORADOR' && !storedUser?.colaboradorId);

    if (!needsSync) return;

    this.http.get<AuthMeResponse>(`${this.apiUrl}/me`).pipe(
      catchError(() => of(null)) // Ignora erro silenciosamente
    ).subscribe((user) => {
      if (user) {
        this.storeCurrentUser(user);
        this._currentUser$.next(this.decodeCurrentUser());
      }
    });
  }

  private hasValidToken(): boolean {
    if (!this.isBrowser) return false;
    const token = this.getItem(ACCESS_KEY);
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
    const rawRole = payload.role || (Array.isArray(payload.roles) ? payload.roles[0] : payload.roles);

    if (rawRole === 'ROLE_ADMIN' || rawRole === 'ADMIN') return 'ROLE_ADMIN';
    if (rawRole === 'ROLE_COLABORADOR' || rawRole === 'COLABORADOR') return 'ROLE_COLABORADOR';

    if (typeof payload.roles === 'string') {
      const roles = payload.roles.split(',').map(r => r.trim());
      if (roles.includes('ROLE_ADMIN') || roles.includes('ADMIN')) return 'ROLE_ADMIN';
      if (roles.includes('ROLE_COLABORADOR') || roles.includes('COLABORADOR')) return 'ROLE_COLABORADOR';
    }

    return null;
  }

  private readRoleFromResponse(res: any): CurrentUser['role'] | null {
    const roles = res.roles || res.authorities || [];
    const rolesArr = Array.isArray(roles) ? roles : [roles];

    if (rolesArr.some((r: any) => r === 'ROLE_ADMIN' || r === 'ADMIN' || r.authority === 'ROLE_ADMIN')) return 'ROLE_ADMIN';
    if (rolesArr.some((r: any) => r === 'ROLE_COLABORADOR' || r === 'COLABORADOR' || r.authority === 'ROLE_COLABORADOR')) return 'ROLE_COLABORADOR';

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

  /**
   * Normaliza a resposta do backend, que pode vir em diferentes formatos (ex: dentro de um campo 'data').
   */
  private normalizeAuthResponse(response: unknown): AuthResponse {
    const source = this.unwrapResponseObject(response);
    const accessToken = this.readString(source, ['accessToken', 'token', 'jwt', 'access_token']);
    const refreshToken = this.readString(source, ['refreshToken', 'refresh_token']) ?? '';

    if (!accessToken) {
      throw new Error('Resposta de autenticação inválida: Token não encontrado.');
    }

    return {
      accessToken,
      refreshToken,
      expiresIn: this.readNumber(source, ['expiresIn', 'expires_in']) ?? 0,
      userId: this.readString(source, ['userId', 'id']),
      colaboradorId: this.readString(source, ['colaboradorId']),
      username: this.readString(source, ['username', 'login', 'userName']) ?? undefined,
      email: this.readString(source, ['email']) ?? undefined,
      roles: this.readRoles(source) ?? undefined
    };
  }

  private normalizeRefreshResponse(response: unknown): RefreshResponse {
    const source = this.unwrapResponseObject(response);
    const accessToken = this.readString(source, ['accessToken', 'token', 'jwt', 'access_token']);

    if (!accessToken) {
      throw new Error('Resposta de refresh inválida: Token não encontrado.');
    }

    return {
      accessToken,
      expiresIn: this.readNumber(source, ['expiresIn', 'expires_in']) ?? 0
    };
  }

  private unwrapResponseObject(payload: unknown): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') return {};
    const source = payload as Record<string, unknown>;
    return (source['data'] && typeof source['data'] === 'object')
      ? (source['data'] as Record<string, unknown>)
      : source;
  }

  private readString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const val = source[key];
      if (typeof val === 'string' && val.trim()) return val.trim();
    }
    return null;
  }

  private readNumber(source: Record<string, unknown>, keys: string[]): number | null {
    for (const key of keys) {
      const val = source[key];
      if (typeof val === 'number') return val;
      if (typeof val === 'string' && !isNaN(Number(val))) return Number(val);
    }
    return null;
  }

  private readRoles(source: Record<string, unknown>): string[] | null {
    const raw = source['roles'] ?? source['authorities'];
    if (Array.isArray(raw)) return raw.map(r => typeof r === 'string' ? r : r.authority).filter(Boolean);
    if (typeof raw === 'string') return raw.split(',').map(r => r.trim()).filter(Boolean);
    return null;
  }
}