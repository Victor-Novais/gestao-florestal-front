import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepicker, MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';

import { NotificationService } from '../../../core/services/notification.service';
import { AreaPlantioOption } from '../../plantio/models/plantio.model';
import { PlantioMetaAreaDTO } from '../models/relatorio.model';
import { RelatorioPlantioService } from '../services/relatorio-plantio.service';
import { MONTH_YEAR_FORMATS } from '../plantio-acumulado/plantio-acumulado.component';

@Component({
  selector: 'app-plantio-metas',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS }
  ],
  templateUrl: './plantio-metas.component.html',
  styleUrl: './plantio-metas.component.scss'
})
export class PlantioMetasComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RelatorioPlantioService);
  private readonly notification = inject(NotificationService);

  loading = signal(false);
  submitting = signal(false);
  metas = signal<PlantioMetaAreaDTO[]>([]);
  areas = signal<AreaPlantioOption[]>([]);

  readonly displayedColumns = ['areaNome', 'periodo', 'metaMudas', 'totalMudas', 'percentualAtingido'];

  readonly filtroForm = this.fb.group({
    mesAno: [new Date()]
  });

  readonly metaForm = this.fb.group({
    areaId: ['', [Validators.required]],
    mesAno: [new Date(), [Validators.required]],
    metaMudas: ['', [Validators.required, this.integerPositiveValidator()]]
  });

  ngOnInit(): void {
    this.service.listarAreas().subscribe({
      next: (areas) => this.areas.set(areas),
      error: () => this.notification.error('Nao foi possivel carregar as areas para metas.')
    });
    this.buscar();
  }

  chosenYearHandler(controlName: 'mesAno', normalizedYear: Date, form: 'filtro' | 'meta'): void {
    const targetForm = form === 'filtro' ? this.filtroForm : this.metaForm;
    const current = (targetForm.value[controlName] as Date | null) ?? new Date();
    current.setFullYear(normalizedYear.getFullYear());
    targetForm.patchValue({ [controlName]: current });
  }

  chosenMonthHandler(controlName: 'mesAno', normalizedMonth: Date, datepicker: MatDatepicker<Date>, form: 'filtro' | 'meta'): void {
    const targetForm = form === 'filtro' ? this.filtroForm : this.metaForm;
    const current = (targetForm.value[controlName] as Date | null) ?? new Date();
    current.setMonth(normalizedMonth.getMonth());
    targetForm.patchValue({ [controlName]: current });
    datepicker.close();
  }

  buscar(): void {
    const date = this.filtroForm.value.mesAno ?? new Date();
    this.loading.set(true);
    this.service.getMetas({ mes: date.getMonth() + 1, ano: date.getFullYear() }).subscribe({
      next: (metas) => {
        this.metas.set(metas);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Nao foi possivel carregar as metas por area.');
      }
    });
  }

  salvarMeta(): void {
    if (this.metaForm.invalid) {
      this.metaForm.markAllAsTouched();
      return;
    }

    const date = this.metaForm.value.mesAno ?? new Date();
    this.submitting.set(true);
    this.service.salvarMeta({
      areaId: `${this.metaForm.value.areaId ?? ''}`,
      mes: date.getMonth() + 1,
      ano: date.getFullYear(),
      metaMudas: Number(this.metaForm.value.metaMudas)
    }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.notification.success('Meta de plantio cadastrada com sucesso.');
        this.buscar();
      },
      error: () => {
        this.submitting.set(false);
        this.notification.error('Nao foi possivel cadastrar a meta de plantio.');
      }
    });
  }

  progressColor(meta: PlantioMetaAreaDTO): 'primary' | 'accent' | 'warn' {
    if (meta.percentualAtingido >= 100) return 'primary';
    if (meta.percentualAtingido >= 50) return 'accent';
    return 'warn';
  }

  periodo(meta: PlantioMetaAreaDTO): string {
    return `${String(meta.mes).padStart(2, '0')}/${meta.ano}`;
  }

  fieldError(controlName: string): string {
    const control = this.metaForm.get(controlName);
    if (!control || !(control.dirty || control.touched)) return '';
    if (control.hasError('required')) return 'Campo obrigatorio.';
    if (control.hasError('integerPositive')) return 'Informe um inteiro maior que zero.';
    return '';
  }

  private integerPositiveValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = Number(control.value);
      return Number.isInteger(value) && value > 0 ? null : { integerPositive: true };
    };
  }
}
