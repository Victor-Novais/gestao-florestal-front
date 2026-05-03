import { Routes } from '@angular/router';
import { authGuard } from '../../../core/guards/auth.guard';
import { roleGuard } from '../../../core/guards/role.guard';

export const SHELL_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },

      // Dashboard (placeholder de áreas por enquanto)
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../../../modules/dashboard/dashboard.component')
            .then(m => m.DashboardComponent)
      },

      // ── ADMIN ── (placeholder até os feature modules serem construídos) ──
      {
        path: 'areas',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadChildren: () =>
          import('../../../modules/areas/area-florestal.module')
            .then(m => m.AreaFlorestalModule)
      },
      {
        path: 'especies',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadChildren: () =>
          import('../../../modules/especies/especies.module')
            .then(m => m.EspeciesModule)
      },
      {
        path: 'colaboradores',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadChildren: () =>
          import('../../../modules/colaboradores/colaboradores.module')
            .then(m => m.ColaboradoresModule)
      },
      {
        path: 'equipamentos',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN'] },
        loadChildren: () =>
          import('../../../modules/equipamentos/equipamentos.module')
            .then(m => m.EquipamentosModule)
      },

      // ── COLABORADOR ───────────────────────────────────────────────────────
      {
        path: 'plantio',
        canActivate: [roleGuard],
        data: { roles: ['ROLE_ADMIN', 'ROLE_COLABORADOR'] },
        loadChildren: () =>
          import('../../../modules/plantio/plantio.module')
            .then(m => m.PlantioModule)
      },
      {
        path: 'inventario',
        loadChildren: () =>
          import('../../../modules/inventario/inventario.routes')
            .then(m => m.INVENTARIO_ROUTES)
      },
      {
        path: 'ocorrencias',
        loadChildren: () =>
          import('../../../modules/ocorrencias/ocorrencias.module').then(m => m.OcorrenciasModule)
      },
      {
        path: 'relatorios',
        loadChildren: () =>
          import('../../../modules/relatorios/relatorios.module').then(m => m.RelatoriosModule)
      },

      // Acesso negado
      {
        path: 'acesso-negado',
        loadComponent: () =>
          import('../../components/access-denied/access-denied.component')
            .then(m => m.AccessDeniedComponent)
      }
    ]
  }
];
