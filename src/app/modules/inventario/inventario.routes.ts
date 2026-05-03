import { Routes } from '@angular/router';

export const INVENTARIO_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/inventario-list/inventario-list.component').then(
        m => m.InventarioListComponent
      ),
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./components/inventario-form/inventario-form.component').then(
        m => m.InventarioFormComponent
      ),
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/inventario-detail/inventario-detail.component').then(
        m => m.InventarioDetailComponent
      ),
  },
  {
    path: 'historico/parcela',
    loadComponent: () =>
      import('./components/inventario-historico/inventario-historico.component').then(
        m => m.InventarioHistoricoComponent
      ),
  },
];
