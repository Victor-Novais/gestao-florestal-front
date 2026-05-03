import { NgModule } from '@angular/core';

import { SharedModule } from '../../shared/shared-module';
import { AreaFlorestalRoutingModule } from './area-florestal-routing.module';
import { AreaFlorestalListComponent } from './components/area-florestal-list.component';

@NgModule({
  declarations: [AreaFlorestalListComponent],
  imports: [
    SharedModule,
    AreaFlorestalRoutingModule
  ]
})
export class AreaFlorestalModule {}
