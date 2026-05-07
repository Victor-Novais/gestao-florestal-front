import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { roleGuard } from '../../core/guards/role.guard';
import { SharedModule } from '../../shared/shared-module';
import { HistoricoParcelaComponent } from './historico-parcela/historico-parcela.component';

const routes: Routes = [
  {
    path: 'dashboard',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () =>
      import('./dashboard/dashboard.component').then((m) => m.DashboardComponent)
  },
  {
    path: 'areas/consolidado',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () =>
      import('./areas-consolidado/areas-consolidado.component')
        .then((m) => m.AreasConsolidadoComponent)
  },
  {
    path: 'especies',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () =>
      import('./especies-relatorio/especies-relatorio.component')
        .then((m) => m.EspeciesRelatorioComponent)
  },
  {
    path: 'historico-parcela',
    component: HistoricoParcelaComponent
  },
  {
    path: 'historico-colaborador',
    loadComponent: () =>
      import('./historico-colaborador/historico-colaborador.component')
        .then((m) => m.HistoricoColaboradorComponent)
  },
  {
    path: 'plantio/confirmacao/:id',
    loadComponent: () =>
      import('./plantio-confirmacao/plantio-confirmacao.component')
        .then((m) => m.PlantioConfirmacaoComponent)
  },
  {
    path: 'plantio/acumulado-mensal',
    loadComponent: () =>
      import('./plantio-acumulado/plantio-acumulado.component')
        .then((m) => m.PlantioAcumuladoComponent)
  },
  {
    path: 'plantio/metas',
    canActivate: [roleGuard],
    data: { roles: ['ROLE_ADMIN'] },
    loadComponent: () =>
      import('./plantio-metas/plantio-metas.component')
        .then((m) => m.PlantioMetasComponent)
  },
  { path: '', redirectTo: 'historico-colaborador', pathMatch: 'full' }
];

@NgModule({
  declarations: [HistoricoParcelaComponent],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class RelatoriosModule {}
