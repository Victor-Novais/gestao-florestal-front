import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable, Injector } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take } from 'rxjs/operators';

import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshToken$ = new BehaviorSubject<string | null>(null);

  constructor(private injector: Injector) {}

  intercept(req: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (this.isAuthRequest(req)) {
      return next.handle(req);
    }

    const authService = this.getAuthService();
    const token = authService.getAccessToken();
    const authReq = token ? this.addToken(req, token) : req;

    return next.handle(authReq).pipe(
      catchError((err) => {
        if (err instanceof HttpErrorResponse && err.status === 401) {
          return this.handle401(req, next);
        }

        return throwError(() => err);
      })
    );
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
    if (this.isRefreshing) {
      return this.refreshToken$.pipe(
        filter((token) => token !== null),
        take(1),
        switchMap((token) => next.handle(this.addToken(req, token!)))
      );
    }

    const authService = this.getAuthService();
    const refreshToken = authService.getRefreshToken();
    if (!refreshToken) {
      authService.logout();
      return throwError(() => new Error('No refresh token available'));
    }

    this.isRefreshing = true;
    this.refreshToken$.next(null);

    return authService.refresh().pipe(
      switchMap((res) => {
        this.isRefreshing = false;
        this.refreshToken$.next(res.accessToken);
        return next.handle(this.addToken(req, res.accessToken));
      }),
      catchError((err) => {
        this.isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      })
    );
  }
}
