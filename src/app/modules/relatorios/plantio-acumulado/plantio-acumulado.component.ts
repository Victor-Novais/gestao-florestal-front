import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MAT_DATE_FORMATS, MAT_DATE_LOCALE, MatNativeDateModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepicker } from '@angular/material/datepicker';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PlantioAcumuladoMensalDTO } from '../models/relatorio.model';
import { RelatorioPlantioService } from '../services/relatorio-plantio.service';
import { ColaboradorPlantioOption } from '../../plantio/models/plantio.model';

export const MONTH_YEAR_FORMATS = {
  parse: { dateInput: 'MM/YYYY' },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY'
  }
};

@Component({
  selector: 'app-plantio-acumulado',
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
    MatSelectModule
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS }
  ],
  templateUrl: './plantio-acumulado.component.html',
  styleUrl: './plantio-acumulado.component.scss'
})
export class PlantioAcumuladoComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly service = inject(RelatorioPlantioService);
  private readonly notification = inject(NotificationService);

  loading = signal(false);
  isAdmin = signal(false);
  currentUserId = signal<string | null>(null);
  acumulado = signal<PlantioAcumuladoMensalDTO | null>(null);
  colaboradores = signal<ColaboradorPlantioOption[]>([]);

  readonly filtroForm = this.fb.group({
    mesAno: [new Date()],
    colaboradorId: ['']
  });

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((user) => {
      const admin = user?.role === 'ROLE_ADMIN';
      this.isAdmin.set(admin);
      this.currentUserId.set(user?.colaboradorId ?? null);

      if (admin) {
        this.service.listarColaboradores().subscribe({
          next: (colaboradores) => this.colaboradores.set(colaboradores)
        });
      } else {
        this.filtroForm.patchValue({ colaboradorId: user?.colaboradorId ?? '' }, { emitEvent: false });
      }

      this.buscar();
    });
  }

  chosenYearHandler(normalizedYear: Date): void {
    const current = this.filtroForm.value.mesAno ?? new Date();
    current.setFullYear(normalizedYear.getFullYear());
    this.filtroForm.patchValue({ mesAno: current });
  }

  chosenMonthHandler(normalizedMonth: Date, datepicker: MatDatepicker<Date>): void {
    const current = this.filtroForm.value.mesAno ?? new Date();
    current.setMonth(normalizedMonth.getMonth());
    this.filtroForm.patchValue({ mesAno: current });
    datepicker.close();
  }

  buscar(): void {
    const date = this.filtroForm.value.mesAno ?? new Date();
    const colaboradorId = this.isAdmin()
      ? (this.filtroForm.value.colaboradorId || null)
      : this.currentUserId();

    this.loading.set(true);
    this.service.getAcumuladoMensal({
      mes: date.getMonth() + 1,
      ano: date.getFullYear(),
      colaboradorId
    }).subscribe({
      next: (data) => {
        this.acumulado.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Nao foi possivel carregar o acumulado mensal de plantio.');
      }
    });
  }

  progressColor(): 'primary' | 'accent' | 'warn' {
    const percentual = this.acumulado()?.percentualAtingido ?? 0;
    if (percentual >= 100) return 'primary';
    if (percentual >= 50) return 'accent';
    return 'warn';
  }
}
