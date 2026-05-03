import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { OcorrenciaResponse, URGENCIA_CONFIG } from '../ocorrencia.model';

@Component({
  selector: 'app-alerta-ocorrencia-dialog',
  standalone: false,
  template: `
    <div class="alerta-dialog" [class.critico]="data.ocorrencia.urgencia === 'CRITICO'">
      <div class="alerta-header">
        <mat-icon class="alerta-icon">{{ isCritico ? 'crisis_alert' : 'warning' }}</mat-icon>
        <h2>{{ isCritico ? 'AÇÃO IMEDIATA NECESSÁRIA' : 'Alerta de Alta Urgência' }}</h2>
      </div>

      <div class="alerta-body">
        <p class="protocolo">Protocolo: <strong>{{ data.ocorrencia.numeroProtocolo }}</strong></p>
        <p>
          <span class="urgencia-badge" [style.background]="urgenciaConfig.bg"
                [style.color]="urgenciaConfig.color">
            {{ urgenciaConfig.label }}
          </span>
        </p>
        <p class="instrucao">
          {{ isCritico
            ? 'Esta ocorrência requer mobilização imediata. Acione os responsáveis e registre as providências tomadas.'
            : 'Esta ocorrência requer atenção prioritária. Acompanhe o andamento e tome as providências necessárias.' }}
        </p>
        <p class="area"><mat-icon>location_on</mat-icon> {{ data.ocorrencia.areaFlorestalNome }}</p>
      </div>

      <div class="alerta-actions">
        <button mat-raised-button [color]="isCritico ? 'warn' : 'primary'"
          (click)="dialogRef.close()">
          Entendido — Ver Ocorrências
        </button>
      </div>
    </div>
  `,
  styles: [`
    .alerta-dialog { padding: 24px; }
    .alerta-dialog.critico { background: #fff5f5; border-top: 4px solid #b71c1c; }
    .alerta-header {
      display: flex; align-items: center; gap: 12px; margin-bottom: 20px;
      h2 { font-size: 1.1rem; font-weight: 700; margin: 0; }
    }
    .alerta-icon { font-size: 36px; height: 36px; width: 36px; color: #b71c1c; }
    .protocolo { font-size: 1rem; margin-bottom: 12px; }
    .urgencia-badge {
      display: inline-block; padding: 4px 12px;
      border-radius: 20px; font-weight: 600; font-size: .85rem;
    }
    .instrucao { margin: 16px 0; color: #555; line-height: 1.5; }
    .area { display: flex; align-items: center; gap: 4px; color: #666; }
    .alerta-actions { text-align: right; margin-top: 20px; }
  `]
})
export class AlertaOcorrenciaDialogComponent {
  isCritico: boolean;
  urgenciaConfig: { label: string; color: string; bg: string };

  constructor(
    public dialogRef: MatDialogRef<AlertaOcorrenciaDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ocorrencia: OcorrenciaResponse }
  ) {
    this.isCritico = data.ocorrencia.urgencia === 'CRITICO';
    this.urgenciaConfig = URGENCIA_CONFIG[data.ocorrencia.urgencia];
  }
}
