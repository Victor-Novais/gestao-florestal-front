import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../core/services/notification.service';
import { EspecieVegetal } from '../especie.model';
import { EspecieService } from '../especie.service';

@Component({
  selector: 'app-especie-confirm-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="false">Cancelar</button>
      <button mat-flat-button color="warn" [mat-dialog-close]="true">Confirmar</button>
    </mat-dialog-actions>
  `
})
export class EspecieConfirmDialogComponent {
  readonly data = inject<{ title: string; message: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-especie-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatCardModule, MatDialogModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './especie-detail.component.html',
  styleUrl: './especie-detail.component.scss'
})
export class EspecieDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly especieService = inject(EspecieService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  especie: EspecieVegetal | null = (history.state?.especie as EspecieVegetal | undefined) ?? null;
  loading = true;
  toggling = false;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      this.notificationService.error('Espécie inválida.');
      return;
    }

    if (this.especie && `${this.especie.id}` === id) {
      this.loading = false;
      return;
    }

    this.especieService.getEspecieById(id).subscribe({
      next: (especie) => {
        this.especie = especie;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Não foi possível carregar os detalhes da espécie.');
      }
    });
  }

  getStatusLabel(value: string): string {
    const porteLabels: Record<string, string> = {
      ARBOREO: 'Arbóreo',
      ARBUSTIVO: 'Arbustivo',
      HERBACEO: 'Herbáceo'
    };
    if (porteLabels[value]) return porteLabels[value];
    return value.replace(/_/g, ' ');
  }

  getOriginLabel(): string {
    return this.especie?.nativa ? 'Nativa' : 'Exótica';
  }

  getToggleLabel(): string {
    return this.especie?.ativo ? 'Inativar' : 'Ativar';
  }

  confirmarAlternancia(): void {
    if (!this.especie?.id) return;

    const ativar = !this.especie.ativo;
    this.dialog.open(EspecieConfirmDialogComponent, {
      data: {
        title: ativar ? 'Confirmar ativação' : 'Confirmar inativação',
        message: ativar
          ? `Deseja ativar a espécie "${this.especie.nomePopular}"?`
          : `Deseja inativar a espécie "${this.especie.nomePopular}"?`
      }
    }).afterClosed().subscribe((confirmed) => {
      if (!confirmed) return;

      this.toggling = true;
      const request$ = ativar
        ? this.especieService.ativar(this.especie!.id!)
        : this.especieService.inativar(this.especie!.id!);

      request$.subscribe({
        next: () => {
          this.toggling = false;
          if (this.especie) this.especie.ativo = ativar;
          this.notificationService.success(
            ativar ? 'Espécie ativada com sucesso.' : 'Espécie inativada com sucesso.'
          );
        },
        error: () => {
          this.toggling = false;
          this.notificationService.error(
            ativar ? 'Não foi possível ativar a espécie.' : 'Não foi possível inativar a espécie.'
          );
        }
      });
    });
  }

  voltar(): void {
    this.router.navigate(['/especies']);
  }
}
