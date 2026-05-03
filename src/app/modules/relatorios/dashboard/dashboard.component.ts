import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { MatCardModule }            from '@angular/material/card';
import { MatIconModule }            from '@angular/material/icon';
import { MatButtonModule }          from '@angular/material/button';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';
import { MatTableModule }           from '@angular/material/table';
import { MatProgressBarModule }     from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule }           from '@angular/material/chips';
import { MatDividerModule }         from '@angular/material/divider';
import { MatTooltipModule }         from '@angular/material/tooltip';

import { RelatorioProdutividadeService } from '../services/relatorio-produtividade.service';
import {
  ProdutividadeResponseDTO,
  OcorrenciaConsolidadoResponseDTO,
  OcorrenciaConsolidadoItemDTO
} from '../models/relatorio.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule,
    MatDatepickerModule, MatNativeDateModule,
    MatTableModule, MatProgressBarModule,
    MatProgressSpinnerModule, MatChipsModule,
    MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './dashboard.component.html',
  styleUrl:    './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {

  private svc = inject(RelatorioProdutividadeService);
  private fb  = inject(FormBuilder);

  loading    = signal(false);
  prodData   = signal<ProdutividadeResponseDTO | null>(null);
  consolidado = signal<OcorrenciaConsolidadoResponseDTO | null>(null);

  filtroForm = this.fb.group({
    dataInicio: [null as Date | null],
    dataFim:    [null as Date | null],
  });

  colunasConsolidado = ['tipo', 'baixo', 'medio', 'alto', 'critico', 'total', 'percentualCriticas'];

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.loading.set(true);
    const { dataInicio, dataFim } = this.filtroForm.getRawValue();

    const ini = dataInicio ? this.toIso(dataInicio) : null;
    const fim = dataFim    ? this.toIso(dataFim)    : null;

    forkJoin({
      prod: this.svc.getProdutividade(ini, fim),
      cons: this.svc.getConsolidadoOcorrencias(ini, fim),
    }).subscribe({
      next: ({ prod, cons }) => {
        this.prodData.set(prod);
        this.consolidado.set(cons);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── KPI helpers ──────────────────────────────────────────────────────────
  get totalMudas(): number {
    return this.prodData()?.totalMudasPorArea
      ?.reduce((acc, a) => acc + a.totalMudas, 0) ?? 0;
  }

  get totalOcorrencias(): number {
    return this.prodData()?.ocorrenciasPorTipoUrgencia
      ?.reduce((acc, o) => acc + o.total, 0) ?? 0;
  }

  get ocorrenciasCriticas(): number {
    return this.prodData()?.ocorrenciasPorTipoUrgencia
      ?.reduce((acc, o) => acc + o.critico, 0) ?? 0;
  }

  get saudeScore(): number {
    return +(this.prodData()?.indiceSaudeFlorestal?.mediaScore ?? 0);
  }

  get saudePercent(): number {
    // score vai de 0 a 4 (CRITICO=0, REGULAR=1, BOM=2, OTIMO=3)
    return Math.round((this.saudeScore / 3) * 100);
  }

  get saudeColor(): string {
    if (this.saudePercent >= 70) return 'primary';
    if (this.saudePercent >= 40) return 'accent';
    return 'warn';
  }

  // ── Gráfico de pizza (SVG simples) ───────────────────────────────────────
  get pizzaSlices(): { tipo: string; percent: number; color: string; path: string }[] {
    const items = this.prodData()?.ocorrenciasPorTipoUrgencia ?? [];
    const total = items.reduce((s, i) => s + i.total, 0);
    if (!total) return [];

    const COLORS = ['#2E7D32','#E65100','#01579B','#6A1B9A','#AD1457','#00695C','#EF6C00','#37474F'];
    let startAngle = 0;

    return items.map((item, i) => {
      const pct   = item.total / total;
      const angle = pct * 2 * Math.PI;
      const x1    = 50 + 40 * Math.cos(startAngle);
      const y1    = 50 + 40 * Math.sin(startAngle);
      const x2    = 50 + 40 * Math.cos(startAngle + angle);
      const y2    = 50 + 40 * Math.sin(startAngle + angle);
      const large = angle > Math.PI ? 1 : 0;
      const path  = `M50,50 L${x1},${y1} A40,40 0 ${large},1 ${x2},${y2} Z`;
      startAngle += angle;
      return { tipo: item.tipo, percent: Math.round(pct * 100), color: COLORS[i % COLORS.length], path };
    });
  }

  // ── Consolidado helpers ───────────────────────────────────────────────────
  isCritico(row: OcorrenciaConsolidadoItemDTO): boolean {
    return row.percentualCriticas > 20;
  }

  tipoLabel(tipo: string): string {
    const MAP: Record<string, string> = {
      INCENDIO: 'Incêndio', DESMATAMENTO_ILEGAL: 'Desmatamento',
      EROSAO: 'Erosão', ESPECIE_INVASORA: 'Espécie Invasora',
      PRAGA_DOENCA: 'Praga/Doença', ACIDENTE_ANIMAL: 'Acidente Animal',
      ACIDENTE_EQUIPE: 'Acidente Equipe', INFRACAO_AMBIENTAL: 'Infração Ambiental',
    };
    return MAP[tipo] ?? tipo;
  }

  private toIso(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
