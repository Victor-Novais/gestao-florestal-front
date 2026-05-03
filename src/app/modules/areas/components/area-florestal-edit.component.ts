import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AreaFlorestal, AreaFlorestalFormData } from '../area-florestal.model';
import { AreaFlorestalService } from '../area-florestal.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-area-florestal-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './area-florestal-edit.component.html',
  styleUrl: './area-florestal-edit.component.scss'
})
export class AreaFlorestalEditComponent implements OnInit {
  private static readonly DECIMAL_PATTERN = /^-?\d+(\.\d{1,6})?$/;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly areaService = inject(AreaFlorestalService);
  private readonly notificationService = inject(NotificationService);

  readonly statusOptions = ['ATIVA', 'EM_RECUPERACAO', 'EMBARGADA', 'RESERVADA'];
  readonly biomaOptions = ['AMAZONIA', 'CAATINGA', 'CERRADO', 'MATA ATLANTICA', 'PAMPA', 'PANTANAL'];
  readonly tipoOptions = ['CONSERVACAO', 'MANEJO', 'PRODUCAO', 'RESTAURACAO'];

  area: AreaFlorestal | null = null;
  areaId: string | null = null;
  isEditMode = false;
  loading = true;
  submitting = false;
  formError: string | null = null;

  readonly form = this.fb.group({
    nome: ['', [Validators.required]],
    latitude: ['', [Validators.required, Validators.pattern(AreaFlorestalEditComponent.DECIMAL_PATTERN)]],
    longitude: ['', [Validators.required, Validators.pattern(AreaFlorestalEditComponent.DECIMAL_PATTERN)]],
    municipio: ['', [Validators.required]],
    estado: ['', [Validators.required]],
    hectares: ['', [Validators.required, this.positiveNumberValidator()]],
    tipo: ['', [Validators.required]],
    bioma: ['', [Validators.required]],
    status: ['']
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!id;
    this.areaId = id;

    if (!this.isEditMode) {
      this.form.get('status')?.clearValidators();
      this.form.get('status')?.updateValueAndValidity();
      this.loading = false;
      return;
    }

    this.form.get('status')?.setValidators([Validators.required]);
    this.form.get('status')?.updateValueAndValidity();

    if (!id) {
      this.loading = false;
      this.notificationService.error('Area florestal invalida.');
      return;
    }

    this.areaService.getAreaById(id).subscribe({
      next: (area) => {
        this.area = area;
        this.patchForm(area);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Nao foi possivel carregar a area para edicao.');
      }
    });
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
    const request$ = this.isEditMode && this.areaId
      ? this.areaService.updateArea(this.areaId, payload)
      : this.areaService.createArea(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.notificationService.success(
          this.isEditMode
            ? 'Area florestal atualizada com sucesso.'
            : 'Area florestal cadastrada com sucesso.'
        );
        this.router.navigate(['/areas']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        if (!this.applyApiValidationErrors(err)) {
          this.formError = 'Nao foi possivel salvar a area florestal.';
        }
      }
    });
  }

  cancelar(): void {
    if (this.area?.id != null) {
      this.router.navigate(['/areas', this.area.id], { state: { area: this.area } });
      return;
    }

    this.router.navigate(['/areas']);
  }

  private patchForm(area: AreaFlorestal): void {
    this.form.patchValue({
      nome: area.nome,
      latitude: this.formatDecimal(area.latitude),
      longitude: this.formatDecimal(area.longitude),
      municipio: area.municipio,
      estado: area.estado,
      hectares: this.formatDecimal(area.hectares),
      tipo: area.tipo,
      bioma: area.bioma,
      status: area.status
    });
  }

  fieldError(controlName: string): string {
    const control = this.form.get(controlName);

    if (!control || !(control.touched || control.dirty)) {
      return '';
    }

    if (control.hasError('required')) return 'Campo obrigatório.';
    if (control.hasError('pattern')) return 'Informe um número válido com até 6 casas decimais.';
    if (control.hasError('positive')) return 'Informe um valor positivo.';
    if (control.hasError('api')) return control.getError('api') as string;

    return '';
  }

  statusLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }

  private buildPayload(): AreaFlorestalFormData {
    const raw = this.form.getRawValue();
    const payload: AreaFlorestalFormData = {
      nome: `${raw.nome ?? ''}`.trim(),
      latitude: Number(raw.latitude),
      longitude: Number(raw.longitude),
      municipio: `${raw.municipio ?? ''}`.trim(),
      estado: `${raw.estado ?? ''}`.trim(),
      hectares: Number(raw.hectares),
      tipo: `${raw.tipo ?? ''}`,
      bioma: `${raw.bioma ?? ''}`
    };

    if (this.isEditMode) {
      payload.status = `${raw.status ?? ''}`;
    }

    return payload;
  }

  private clearApiErrors(): void {
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);
      if (!control?.errors?.['api']) {
        return;
      }

      const { api, ...remainingErrors } = control.errors;
      control.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    });
  }

  private applyApiValidationErrors(err: HttpErrorResponse): boolean {
    if (![400, 422].includes(err.status)) {
      return false;
    }

    const fieldErrors = this.extractFieldErrors(err.error);
    let hasMappedError = false;

    Object.entries(fieldErrors).forEach(([field, message]) => {
      const control = this.form.get(this.normalizeFieldName(field));
      if (!control) {
        return;
      }

      control.setErrors({ ...(control.errors ?? {}), api: message });
      control.markAsTouched();
      hasMappedError = true;
    });

    if (!hasMappedError && typeof err.error?.message === 'string') {
      this.formError = err.error.message;
    }

    return hasMappedError || !!this.formError;
  }

  private extractFieldErrors(payload: unknown): Record<string, string> {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const source = payload as Record<string, unknown>;
    const containers = ['errors', 'fieldErrors', 'violations'];
    const extracted: Record<string, string> = {};

    for (const key of containers) {
      const value = source[key];

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (!item || typeof item !== 'object') {
            return;
          }

          const entry = item as Record<string, unknown>;
          const field = this.firstString(entry, ['field', 'campo', 'name', 'property']);
          const message = this.firstString(entry, ['message', 'mensagem', 'defaultMessage']);

          if (field && message) {
            extracted[field] = message;
          }
        });
      } else if (value && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([field, message]) => {
          if (typeof message === 'string' && message.trim()) {
            extracted[field] = message.trim();
          }
        });
      }
    }

    return extracted;
  }

  private normalizeFieldName(field: string): string {
    const normalized = field.toLowerCase();
    const aliases: Record<string, string> = {
      cidade: 'municipio',
      uf: 'estado',
      lat: 'latitude',
      lon: 'longitude',
      lng: 'longitude'
    };

    return aliases[normalized] ?? normalized;
  }

  private firstString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private positiveNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = Number(control.value);
      if (!Number.isFinite(value) || value <= 0) {
        return { positive: true };
      }

      return null;
    };
  }

  private formatDecimal(value: number): string {
    return Number.isFinite(value) ? `${value}` : '';
  }
}
