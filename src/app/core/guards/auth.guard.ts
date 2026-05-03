import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * AuthGuard (functional guard) — redireciona para /login
 * se o usuário não estiver autenticado.
 */
export const authGuard: CanActivateFn = (_route, _state) => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.isAuthenticated$.pipe(
    take(1),
    map(isAuth => {
      if (isAuth) return true;
      return router.createUrlTree(['/login']);
    })
  );
};
