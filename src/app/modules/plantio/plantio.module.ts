import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { PlantioRoutingModule } from './plantio-routing.module';
import { PlantioListComponent } from './pages/plantio-list.component';

@NgModule({
  declarations: [PlantioListComponent],
  imports: [SharedModule, PlantioRoutingModule]
})
export class PlantioModule {}
