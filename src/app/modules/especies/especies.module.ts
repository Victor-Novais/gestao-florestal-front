import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { EspeciesRoutingModule } from './especies-routing.module';
import { EspeciesListComponent } from './components/especies-list.component';

@NgModule({
  declarations: [EspeciesListComponent],
  imports: [SharedModule, EspeciesRoutingModule]
})
export class EspeciesModule {}
