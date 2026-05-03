import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { PlantioListComponent } from './pages/plantio-list.component';

const routes: Routes = [
  {
    path: '',
    component: PlantioListComponent
  },
  {
    path: 'novo',
    loadComponent: () =>
      import('./pages/plantio-form.component').then(m => m.PlantioFormComponent)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PlantioRoutingModule {}
