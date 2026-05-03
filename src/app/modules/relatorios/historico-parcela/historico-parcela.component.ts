import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Chart, registerables } from 'chart.js';
import { environment } from '../../../../environments/environment';
import { RelatorioInventarioService } from '../relatorio-inventario.service';
import {
  HistoricoParcelaItem,
  ESTADO_GERAL_CONFIG, TENDENCIA_CONFIG
} from '../historico-parcela.model';

Chart.register(...registerables);

@Component({
  selector: 'app-historico-parcela',
  standalone: false,
  templateUrl: './historico-parcela.component.html',
  styleUrls: ['./historico-parcela.component.scss']
})
export class HistoricoParcelaComponent implements OnInit, OnDestroy {
  @ViewChild('dapChart') dapChartRef!: ElementRef<HTMLCanvasElement>;

  form!: FormGroup;
  areas: { id: string; nome: string }[] = [];
  historico: HistoricoParcelaItem[] = [];
  loading = false;
  pesquisado = false;
  private chart?: Chart;

  ESTADO_CONFIG = ESTADO_GERAL_CONFIG;
  TENDENCIA_CONFIG = TENDENCIA_CONFIG;

  constructor(
    private fb: FormBuilder,
    private service: RelatorioInventarioService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      areaId:     [null, Validators.required],
      parcela:    ['',   Validators.required],
      dataInicio: [null],
      dataFim:    [null],
    });

    this.http.get<any>(`${environment.apiUrl}/api/areas?size=100`)
      .subscribe(res => this.areas = res.content ?? []);
  }

  buscar(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.loading = true;
    this.pesquisado = false;

    const { areaId, parcela, dataInicio, dataFim } = this.form.value;
    this.service.buscarHistoricoParcela({
      areaId,
      parcela,
      dataInicio: dataInicio ? this.toDate(dataInicio) : undefined,
      dataFim:    dataFim    ? this.toDate(dataFim)    : undefined,
    }).subscribe({
      next: (data) => {
        this.historico = data;
        this.loading = false;
        this.pesquisado = true;
        setTimeout(() => this.renderizarGrafico(), 100);
      },
      error: () => { this.loading = false; this.pesquisado = true; }
    });
  }

  renderizarGrafico(): void {
    if (!this.dapChartRef || !this.historico.length) return;
    this.chart?.destroy();

    const labels = this.historico.map(h =>
      new Date(h.dataVistoria).toLocaleDateString('pt-BR'));
    const dados  = this.historico.map(h => Number(h.dapMedioAtual));

    this.chart = new Chart(this.dapChartRef.nativeElement, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'DAP Médio (cm)',
          data: dados,
          borderColor: '#2e7d32',
          backgroundColor: 'rgba(46,125,50,.1)',
          borderWidth: 2,
          pointBackgroundColor: '#2e7d32',
          pointRadius: 5,
          tension: 0.3,
          fill: true,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'top' },
          title: { display: true, text: 'Evolução do DAP Médio' }
        },
        scales: {
          y: { title: { display: true, text: 'DAP (cm)' }, beginAtZero: false }
        }
      }
    });
  }

  variacaoDapFormatada(item: HistoricoParcelaItem): string {
    if (item.variacaoDap == null) return '—';
    const v = Number(item.variacaoDap);
    return (v > 0 ? '+' : '') + v.toFixed(2) + ' cm';
  }

  variacaoDapCor(item: HistoricoParcelaItem): string {
    if (item.variacaoDap == null) return '#999';
    return Number(item.variacaoDap) >= 0 ? '#2e7d32' : '#b71c1c';
  }

  ePrimeira(index: number): boolean { return index === 0; }

  private toDate(value: Date | string): string {
    return new Date(value).toISOString().split('T')[0];
  }

  ngOnDestroy(): void { this.chart?.destroy(); }
}
