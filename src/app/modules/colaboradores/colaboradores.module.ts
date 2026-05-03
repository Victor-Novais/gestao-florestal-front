import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';

import { SharedModule } from '../../shared/shared-module';
import { ColaboradoresRoutingModule } from './colaboradores-routing.module';
import { ColaboradorListComponent } from './pages/colaborador-list.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@NgModule({
  declarations: [ColaboradorListComponent],
  imports: [SharedModule, ColaboradoresRoutingModule, MatDialogModule]
})
export class ColaboradoresModule {}
