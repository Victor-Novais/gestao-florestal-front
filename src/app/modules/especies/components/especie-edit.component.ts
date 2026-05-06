import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { NotificationService } from '../../../core/services/notification.service';
import { EspecieFormData, EspecieVegetal } from '../especie.model';
import { EspecieService } from '../especie.service';

@Component({
  selector: 'app-especie-alert-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule],
  template: `
    <h2 mat-dialog-title>Alerta de Conservação</h2>
    <mat-dialog-content class="dialog-content">
      <mat-icon color="warn">warning</mat-icon>
      <p>A espécie "{{ data.nomePopular }}" foi salva com status <strong>AMEAÇADA</strong>.</p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="warn" mat-dialog-close>Entendi</button>
    </mat-dialog-actions>
  `,
  styles: [`.dialog-content{display:flex;align-items:center;gap:12px;}`]
})
export class EspecieAlertDialogComponent {
  readonly data = inject<{ nomePopular: string }>(MAT_DIALOG_DATA);
}

@Component({
  selector: 'app-especie-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './especie-edit.component.html',
  styleUrl: './especie-edit.component.scss'
})
export class EspecieEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly especieService = inject(EspecieService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  readonly statusOptions = ['AMEACADA', 'VULNERAVEL', 'POUCO_PREOCUPANTE', 'EXTINTA_NA_NATUREZA'];
  /** Valores alinhados ao enum `Porte` da API (forma de vida, não porte por tamanho). */
  readonly porteOptions = ['ARBOREO', 'ARBUSTIVO', 'HERBACEO'] as const;

  especie: EspecieVegetal | null = null;
  especieId: string | null = null;
  isEditMode = false;
  loading = true;
  submitting = false;
  formError: string | null = null;

  readonly form = this.fb.group({
    nomeCientifico: ['', [Validators.required]],
    nomePopular: ['', [Validators.required]],
    familiaBotanica: ['', [Validators.required]],
    porte: ['', [Validators.required]],
    statusConservacao: ['', [Validators.required]],
    cicloVida: ['', [Validators.required, this.positiveNumberValidator()]],
    exigenciasClimaticas: ['', [Validators.required]],
    exigenciasSolo: ['', [Validators.required]],
    nativa: [true]
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!id;
    this.especieId = id;

    if (!this.isEditMode) {
      this.loading = false;
      return;
    }

    if (!id) {
      this.loading = false;
      this.notificationService.error('Espécie inválida.');
      return;
    }

    this.especieService.getEspecieById(id).subscribe({
      next: (especie) => {
        this.especie = especie;
        this.patchForm(especie);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Não foi possível carregar a espécie para edição.');
      }
    });
  }

  get originLabel(): string {
    return this.form.get('nativa')?.value ? 'Nativa' : 'Exótica';
  }

  fieldError(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Campo obrigatório.';
    if (control.hasError('positive')) return 'Informe um valor positivo.';
    if (control.hasError('api')) return control.getError('api') as string;
    return '';
  }

  statusLabel(value: string): string {
    const porteLabels: Record<string, string> = {
      ARBOREO: 'Arbóreo',
      ARBUSTIVO: 'Arbustivo',
      HERBACEO: 'Herbáceo'
    };
    if (porteLabels[value]) return porteLabels[value];
    return value.replace(/_/g, ' ');
  }

  salvar(): void {
    this.formError = null;
    this.clearApiErrors();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const payload = this.buildPayload();
    const request$ = this.isEditMode && this.especieId
      ? this.especieService.updateEspecie(this.especieId, payload)
      : this.especieService.createEspecie(payload);

    request$.subscribe({
      next: (especie) => {
        this.submitting = false;
        const finish = () => {
          this.notificationService.success(
            this.isEditMode ? 'Espécie atualizada com sucesso.' : 'Espécie cadastrada com sucesso.'
          );
          this.router.navigate(['/especies']);
        };

        if (especie.statusConservacao === 'AMEACADA') {
          this.dialog.open(EspecieAlertDialogComponent, {
            data: { nomePopular: especie.nomePopular }
          }).afterClosed().subscribe(() => finish());
          return;
        }

        finish();
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        if (!this.applyApiErrors(err)) {
          this.formError = 'Não foi possível salvar a espécie.';
        }
      }
    });
  }

  cancelar(): void {
    if (this.especie?.id != null) {
      this.router.navigate(['/especies', this.especie.id], { state: { especie: this.especie } });
      return;
    }

    this.router.navigate(['/especies']);
  }

  private buildPayload(): EspecieFormData {
    const raw = this.form.getRawValue();
    return {
      nomeCientifico: `${raw.nomeCientifico ?? ''}`.trim(),
      nomePopular: `${raw.nomePopular ?? ''}`.trim(),
      familiaBotanica: `${raw.familiaBotanica ?? ''}`.trim(),
      porte: `${raw.porte ?? ''}`,
      statusConservacao: `${raw.statusConservacao ?? ''}`,
      cicloVida: Number(raw.cicloVida),
      exigenciasClimaticas: `${raw.exigenciasClimaticas ?? ''}`.trim(),
      exigenciasSolo: `${raw.exigenciasSolo ?? ''}`.trim(),
      nativa: !!raw.nativa
    };
  }

  private patchForm(especie: EspecieVegetal): void {
    this.form.patchValue({
      nomeCientifico: especie.nomeCientifico,
      nomePopular: especie.nomePopular,
      familiaBotanica: especie.familiaBotanica,
      porte: especie.porte,
      statusConservacao: especie.statusConservacao,
      cicloVida: `${especie.cicloVida}`,
      exigenciasClimaticas: especie.exigenciasClimaticas,
      exigenciasSolo: especie.exigenciasSolo,
      nativa: especie.nativa
    });
  }

  private clearApiErrors(): void {
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);
      if (!control?.errors?.['api']) return;
      const { api, ...remainingErrors } = control.errors;
      control.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    });
  }

  private applyApiErrors(err: HttpErrorResponse): boolean {
    if (err.status === 409) {
      const ctrl = this.form.get('nomeCientifico');
      ctrl?.setErrors({ ...(ctrl.errors ?? {}), api: 'Nome científico já cadastrado.' });
      ctrl?.markAsTouched();
      return true;
    }

    if (![400, 422].includes(err.status) || !err.error || typeof err.error !== 'object') {
      return false;
    }

    const payload = err.error as Record<string, unknown>;
    const fieldErrors = this.extractFieldErrors(payload);
    let hasMappedError = false;

    Object.entries(fieldErrors).forEach(([field, message]) => {
      const control = this.form.get(this.normalizeFieldName(field));
      if (!control) return;
      control.setErrors({ ...(control.errors ?? {}), api: message });
      control.markAsTouched();
      hasMappedError = true;
    });

    if (!hasMappedError && typeof payload['message'] === 'string') {
      this.formError = payload['message'];
    }

    return hasMappedError || !!this.formError;
  }

  private extractFieldErrors(payload: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of ['errors', 'fieldErrors', 'violations']) {
      const value = payload[key];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (!item || typeof item !== 'object') return;
          const entry = item as Record<string, unknown>;
          const field = this.firstString(entry, ['field', 'campo', 'name', 'property']);
          const message = this.firstString(entry, ['message', 'mensagem', 'defaultMessage']);
          if (field && message) result[field] = message;
        });
      } else if (value && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([field, message]) => {
          if (typeof message === 'string' && message.trim()) result[field] = message.trim();
        });
      }
    }
    return result;
  }

  private firstString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }

  private normalizeFieldName(field: string): string {
    const aliases: Record<string, string> = {
      familia: 'familiaBotanica',
      clima: 'exigenciasClimaticas',
      solo: 'exigenciasSolo',
      ciclo: 'cicloVida'
    };
    return aliases[field] ?? field;
  }

  private positiveNumberValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = Number(control.value);
      return Number.isFinite(value) && value > 0 ? null : { positive: true };
    };
  }
}
