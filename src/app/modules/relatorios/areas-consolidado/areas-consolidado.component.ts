import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Chart, registerables } from 'chart.js';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import {
  AreaConsolidadoBiomaDTO,
  AreaConsolidadoResponseDTO,
  AreaConsolidadoStatusDTO,
  AreaConsolidadoTipoDTO
} from '../models/relatorio.model';
import { RelatorioAreasService } from '../services/relatorio-areas.service';
import { NotificationService } from '../../../core/services/notification.service';

Chart.register(...registerables);

@Component({
  selector: 'app-areas-consolidado',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './areas-consolidado.component.html',
  styleUrl: './areas-consolidado.component.scss'
})
export class AreasConsolidadoComponent implements AfterViewInit, OnDestroy {
  @ViewChild('hectaresChart') hectaresChartRef?: ElementRef<HTMLCanvasElement>;

  private readonly fb = inject(FormBuilder);
  private readonly service = inject(RelatorioAreasService);
  private readonly notification = inject(NotificationService);

  readonly statusOptions = ['ATIVA', 'EM_RECUPERACAO', 'EMBARGADA', 'RESERVADA'];
  readonly filtroForm = this.fb.group({
    status: ['']
  });

  loading = signal(false);
  consolidado = signal<AreaConsolidadoResponseDTO | null>(null);
  private chart?: Chart;

  constructor() {
    this.filtroForm.valueChanges.subscribe(() => this.carregar());
  }

  ngAfterViewInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  get totalAreas(): number {
    return this.consolidado()?.totalAreas ?? 0;
  }

  get totalHectares(): number {
    return this.consolidado()?.totalHectares ?? 0;
  }

  get totaisPorStatus(): AreaConsolidadoStatusDTO[] {
    return this.consolidado()?.totaisPorStatus ?? [];
  }

  get agrupadoPorBioma(): AreaConsolidadoBiomaDTO[] {
    return this.consolidado()?.agrupadoPorBioma ?? [];
  }

  get agrupadoPorTipo(): AreaConsolidadoTipoDTO[] {
    return this.consolidado()?.agrupadoPorTipo ?? [];
  }

  carregar(): void {
    this.loading.set(true);
    const status = this.filtroForm.getRawValue().status || null;

    this.service.getConsolidado(status).subscribe({
      next: (data) => {
        this.consolidado.set(data);
        this.loading.set(false);
        queueMicrotask(() => this.renderChart());
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Nao foi possivel carregar o consolidado de areas.');
      }
    });
  }

  imprimir(): void {
    window.print();
  }

  statusLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }

  trackByBioma(_index: number, item: AreaConsolidadoBiomaDTO): string {
    return item.bioma;
  }

  trackByTipo(_index: number, item: AreaConsolidadoTipoDTO): string {
    return item.tipo;
  }

  trackByStatus(_index: number, item: AreaConsolidadoStatusDTO): string {
    return item.status;
  }

  private renderChart(): void {
    if (!this.hectaresChartRef) {
      return;
    }

    const biomas = this.agrupadoPorBioma;
    this.chart?.destroy();

    this.chart = new Chart(this.hectaresChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: biomas.map((item) => item.bioma),
        datasets: [{
          label: 'Total de hectares',
          data: biomas.map((item) => item.totalHectares),
          backgroundColor: ['#2E7D32', '#558B2F', '#7CB342', '#9CCC65', '#689F38', '#33691E'],
          borderRadius: 8,
          maxBarThickness: 56
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Total de Hectares por Bioma'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Hectares'
            }
          }
        }
      }
    });
  }
}
