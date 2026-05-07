import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, switchMap } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  /** Um único refresh em voo; novos chamadores reutilizam o mesmo Observable. */
  private refreshInFlight$: Observable<string> | null = null;

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isAuthRequest(req)) {
      return next.handle(req);
    }

    const authService = this.getAuthService();
    const token = authService.getAccessToken();

    const send = (accessToken: string | null): Observable<HttpEvent<unknown>> => {
      const authReq = accessToken ? this.addToken(req, accessToken) : req;
      return next.handle(authReq).pipe(
        catchError((err) => {
          if (err instanceof HttpErrorResponse && err.status === 401) {
            return this.handle401(req, next);
          }
          return throwError(() => err);
        })
      );
    };

    // Renova antes de enviar só se houver refresh token (evita erro em SSR/prerender sem sessão).
    if (token && authService.isTokenExpired(token) && authService.getRefreshToken()) {
      return this.refreshAccessToken().pipe(switchMap((t) => send(t)));
    }

    return send(token);
  }

  private getAuthService(): AuthService {
    return this.injector.get(AuthService);
  }

  private addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  private isAuthRequest(req: HttpRequest<unknown>): boolean {
    return req.url.includes('/auth/login')
      || req.url.includes('/auth/register')
      || req.url.includes('/auth/refresh');
  }

  private handle401(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    return this.refreshAccessToken().pipe(
      switchMap((newToken) => next.handle(this.addToken(req, newToken)))
    );
  }

  private refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    const authService = this.getAuthService();
    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) {
      authService.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    this.refreshInFlight$ = authService.refresh().pipe(
      map((res) => res.accessToken),
      catchError((err) => {
        authService.logout();
        return throwError(() => err);
      }),
      shareReplay({ bufferSize: 1, refCount: true }),
      finalize(() => {
        this.refreshInFlight$ = null;
      })
    );

    return this.refreshInFlight$;
  }
}
