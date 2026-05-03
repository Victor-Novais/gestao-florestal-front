import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../shared/shared-module';

import { OcorrenciaFormComponent } from './form/ocorrencia-form.component';
import { OcorrenciaListaComponent } from './lista/ocorrencia-lista.component';
import { OcorrenciaDetalheComponent } from './detalhe/ocorrencia-detalhe.component';
import { AlertaOcorrenciaDialogComponent } from './alerta-dialog/alerta-ocorrencia-dialog.component';

const routes: Routes = [
  { path: '',        component: OcorrenciaListaComponent },
  { path: 'novo',    component: OcorrenciaFormComponent },
  { path: ':id',     component: OcorrenciaDetalheComponent },
];

@NgModule({
  declarations: [
    OcorrenciaFormComponent,
    OcorrenciaListaComponent,
    OcorrenciaDetalheComponent,
    AlertaOcorrenciaDialogComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)]
})
export class OcorrenciasModule {}
