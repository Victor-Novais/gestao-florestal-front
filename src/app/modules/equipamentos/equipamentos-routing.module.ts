import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { EquipamentoListComponent } from './pages/equipamento-list/equipamento-list.component';

const routes: Routes = [
  {
    path: '',
    component: EquipamentoListComponent
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./pages/equipamento-form/equipamento-form.component').then((m) => m.EquipamentoFormComponent)
  },
  {
    path: 'editar/:id',
    loadComponent: () =>
      import('./pages/equipamento-form/equipamento-form.component').then((m) => m.EquipamentoFormComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class EquipamentosRoutingModule {}
