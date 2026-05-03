import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ColaboradorListComponent } from './pages/colaborador-list.component';

const routes: Routes = [
  {
    path: '',
    component: ColaboradorListComponent
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./pages/colaborador-edit.component').then(m => m.ColaboradorEditComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./pages/colaborador-detail.component').then(m => m.ColaboradorDetailComponent)
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./pages/colaborador-edit.component').then(m => m.ColaboradorEditComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ColaboradoresRoutingModule {}
