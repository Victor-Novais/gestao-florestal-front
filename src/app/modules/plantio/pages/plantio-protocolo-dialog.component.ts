import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface PlantioProtocoloDialogData {
  protocolo: string;
}

@Component({
  selector: 'app-plantio-protocolo-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="dialog-header">
      <mat-icon class="success-icon">check_circle</mat-icon>
      <h2 mat-dialog-title>Plantio Registrado!</h2>
    </div>

    <mat-dialog-content>
      <p class="msg">O plantio foi salvo com sucesso e o protocolo abaixo foi gerado.</p>
      <div class="protocol-box">
        <span class="protocol-label">Protocolo</span>
        <span class="protocol-value">{{ data.protocolo }}</span>
      </div>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-stroked-button (click)="novoRegistro()">
        <mat-icon>add</mat-icon>
        Novo Plantio
      </button>
      <button mat-flat-button color="primary" (click)="verListagem()">
        <mat-icon>list</mat-icon>
        Ver Listagem
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 1.25rem 1.5rem 0;
    }
    .success-icon {
      color: #2e7d32;
      font-size: 2rem;
      width: 2rem;
      height: 2rem;
    }
    h2 { margin: 0; font-size: 1.2rem; font-weight: 500; }
    .msg { color: rgba(0,0,0,0.6); margin-bottom: 1rem; }
    .protocol-box {
      background: #f1f8e9;
      border: 1px solid #c5e1a5;
      border-radius: 8px;
      padding: 1rem 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }
    .protocol-label {
      font-size: 0.75rem;
      color: #388e3c;
      font-weight: 500;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .protocol-value {
      font-size: 1.25rem;
      font-weight: 500;
      color: #1b5e20;
      font-family: monospace;
    }
  `]
})
export class PlantioProtocoloDialogComponent {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: PlantioProtocoloDialogData,
    private readonly ref: MatDialogRef<PlantioProtocoloDialogComponent>,
    private readonly router: Router
  ) {}

  novoRegistro(): void {
    this.ref.close();
    this.router.navigate(['/plantio/novo']);
  }

  verListagem(): void {
    this.ref.close();
    this.router.navigate(['/plantio']);
  }
}
