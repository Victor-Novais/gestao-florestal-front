import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EspeciesListComponent } from './components/especies-list.component';

const routes: Routes = [
  {
    path: '',
    component: EspeciesListComponent
  },
  {
    path: 'nova',
    loadComponent: () =>
      import('./components/especie-edit.component').then(m => m.EspecieEditComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/especie-detail.component').then(m => m.EspecieDetailComponent)
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/especie-edit.component').then(m => m.EspecieEditComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EspeciesRoutingModule {}
