import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

/**
 * RoleGuard (functional guard) — verifica se o usuário logado possui
 * um dos papéis informados em `data.roles` da rota.
 *
 * Uso na rota:
 * {
 *   path: 'areas',
 *   canActivate: [authGuard, roleGuard],
 *   data: { roles: ['ROLE_ADMIN'] },
 *   ...
 * }
 */
export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot, _state) => {
  const auth    = inject(AuthService);
  const router  = inject(Router);
  const allowed: string[] = route.data?.['roles'] ?? [];

  return auth.currentUser$.pipe(
    take(1),
    map(user => {
      if (!user) return router.createUrlTree(['/login']);

      if (allowed.length === 0 || allowed.includes(user.role)) {
        return true;
      }

      return router.createUrlTree(['/acesso-negado']);
    })
  );
};
