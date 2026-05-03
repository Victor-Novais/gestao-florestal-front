import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadChildren: () =>
      import('./modules/auth/auth-routing-module').then(m => m.AuthRoutingModule)
  },
  {
    path: '',
    loadChildren: () =>
      import('./shared/components/shell/shell.routes').then(m => m.SHELL_ROUTES)
  },
  {
    path: 'equipamentos/novo',
    loadComponent: () =>
      import('./modules/equipamentos/pages/equipamento-form/equipamento-form.component').then(m => m.EquipamentoFormComponent)
  },
  {
    path: 'equipamentos/editar/:id',
    loadComponent: () =>
      import('./modules/equipamentos/pages/equipamento-form/equipamento-form.component').then(m => m.EquipamentoFormComponent)
  },
  // --- MÓDULO DE PLANTIOS ---
  {
    path: 'plantios/novo',
    loadComponent: () =>
      import('./modules/plantio/pages/plantio-form/plantio-form.component').then(m => m.PlantioFormComponent)
  },
  {
    path: 'plantios/relatorio', // Rota da Task T6
    loadComponent: () =>
      import('./modules/plantio/pages/plantio-report/plantio-report.component').then(m => m.PlantioReportComponent)
  },
  // --- Rota coringa sempre por ÚLTIMO ---
  {
    path: '**',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
