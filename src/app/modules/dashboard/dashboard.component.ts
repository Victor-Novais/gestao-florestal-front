import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Chart, registerables } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';

import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

Chart.register(...registerables);

interface KpiData {
  totalMudasPlantadas: number;
  taxaCoberturaBioma: Record<string, number>;
  numeroOcorrenciasUrgencia: Record<string, number>;
  indiceSaudeFlorestal: number;
}

interface OcorrenciaConsolidada {
  tipo: string;
  total: number;
  subtotaisUrgencia: Record<string, number>;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    BaseChartDirective
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  loading = signal(false);
  kpiData = signal<KpiData | null>(null);
  ocorrenciasConsolidado = signal<OcorrenciaConsolidada[]>([]);
  chartData = signal<any>(null);

  readonly filterForm = this.fb.group({
    dataInicio: ['', Validators.required],
    dataFim: ['', Validators.required]
  });

  ngOnInit(): void {
    // Set default dates (last 30 days)
    const hoje = new Date();
    const trintaDiasAtras = new Date();
    trintaDiasAtras.setDate(hoje.getDate() - 30);

    this.filterForm.patchValue({
      dataInicio: trintaDiasAtras.toISOString().split('T')[0],
      dataFim: hoje.toISOString().split('T')[0]
    });

    this.loadDashboard();
  }

  loadDashboard(): void {
    if (this.filterForm.invalid) {
      this.filterForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { dataInicio, dataFim } = this.filterForm.value;

    // Mock data for now - replace with actual API calls
    setTimeout(() => {
      this.kpiData.set({
        totalMudasPlantadas: 15420,
        taxaCoberturaBioma: {
          'AMAZONIA': 85.5,
          'CERRADO': 72.3,
          'MATA ATLANTICA': 68.9
        },
        numeroOcorrenciasUrgencia: {
          'BAIXO': 12,
          'MEDIO': 8,
          'ALTO': 3,
          'CRITICO': 1
        },
        indiceSaudeFlorestal: 7.2
      });

      this.ocorrenciasConsolidado.set([
        {
          tipo: 'INCENDIO',
          total: 5,
          subtotaisUrgencia: { 'BAIXO': 2, 'MEDIO': 2, 'ALTO': 1, 'CRITICO': 0 }
        },
        {
          tipo: 'DESMATAMENTO_ILEGAL',
          total: 8,
          subtotaisUrgencia: { 'BAIXO': 3, 'MEDIO': 3, 'ALTO': 2, 'CRITICO': 0 }
        },
        {
          tipo: 'PRAGA_DOENCA',
          total: 6,
          subtotaisUrgencia: { 'BAIXO': 4, 'MEDIO': 1, 'ALTO': 1, 'CRITICO': 0 }
        }
      ]);

      this.updateChart();
      this.loading.set(false);
    }, 1000);
  }

  private updateChart(): void {
    const data = this.ocorrenciasConsolidado();
    this.chartData.set({
      labels: data.map(item => item.tipo),
      datasets: [{
        data: data.map(item => item.total),
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0',
          '#9966FF'
        ]
      }]
    });
  }

  getPercentualCriticas(): number {
    const ocorrencias = this.kpiData()?.numeroOcorrenciasUrgencia;
    if (!ocorrencias) return 0;

    const criticas = (ocorrencias['ALTO'] || 0) + (ocorrencias['CRITICO'] || 0);
    const total = Object.values(ocorrencias).reduce((sum, val) => sum + val, 0);
    return total > 0 ? (criticas / total) * 100 : 0;
  }

  getSaudeColor(): string {
    const indice = this.kpiData()?.indiceSaudeFlorestal || 0;
    if (indice >= 8) return 'green';
    if (indice >= 6) return 'orange';
    return 'red';
  }

  get biomasMonitoradosCount(): number {
    const biomas = this.kpiData()?.taxaCoberturaBioma;
    return biomas ? Object.keys(biomas).length : 0;
  }
}