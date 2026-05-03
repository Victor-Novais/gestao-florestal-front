import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { AreaFlorestalListComponent } from './components/area-florestal-list.component';

const routes: Routes = [
  {
    path: '',
    component: AreaFlorestalListComponent
  },
  {
    path: 'nova',
    loadComponent: () =>
      import('./components/area-florestal-edit.component').then(m => m.AreaFlorestalEditComponent)
  },
  {
    path: ':id',
    loadComponent: () =>
      import('./components/area-florestal-detail.component').then(m => m.AreaFlorestalDetailComponent)
  },
  {
    path: ':id/editar',
    loadComponent: () =>
      import('./components/area-florestal-edit.component').then(m => m.AreaFlorestalEditComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AreaFlorestalRoutingModule {}
