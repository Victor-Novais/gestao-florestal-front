import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { EquipamentosRoutingModule } from './equipamentos-routing.module';
import { EquipamentoListComponent } from './pages/equipamento-list/equipamento-list.component';

@NgModule({
  imports: [
    SharedModule,
    EquipamentosRoutingModule,
    EquipamentoListComponent
  ]
})
export class EquipamentosModule {}
