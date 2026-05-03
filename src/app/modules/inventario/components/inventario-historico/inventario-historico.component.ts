import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { MatCardModule }            from '@angular/material/card';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatProgressBarModule }     from '@angular/material/progress-bar';
import { MatDividerModule }         from '@angular/material/divider';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';

import { InventarioService } from '../../services/inventario.service';

export interface HistoricoItem {
  inventarioId: string;
  dataVistoria: string;
  parcela: string;
  areaId: string;
  estadoGeral: string;
  mudancaEstadoGeral: string | null;
  dapMedioAtual: number | null;
  variacaoDap: number | null;
  tendencia: string | null;
  especies: any[];
}

@Component({
  selector: 'app-inventario-historico',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatFormFieldModule, MatInputModule, MatSelectModule,
    MatButtonModule, MatIconModule, MatProgressBarModule, MatDividerModule,
    MatTooltipModule, MatDatepickerModule, MatNativeDateModule,
  ],
  templateUrl: './inventario-historico.component.html',
  styleUrl: './inventario-historico.component.scss',
})
export class InventarioHistoricoComponent implements OnInit {

  private svc    = inject(InventarioService);
  private fb     = inject(FormBuilder);
  private router = inject(Router);

  loading  = signal(false);
  buscado  = signal(false);
  itens    = signal<HistoricoItem[]>([]);
  areas    = signal<any[]>([]);

  form = this.fb.group({
    areaId:  ['', Validators.required],
    parcela: ['', Validators.required],
  });

  ngOnInit(): void {
    this.svc.listarAreasAtivas().subscribe({
      next: (res: any) => this.areas.set(res?.content ?? res ?? []),
    });
  }

  buscar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { areaId, parcela } = this.form.getRawValue();

    this.svc.buscarHistoricoParcela(
      '',
      areaId!,
      parcela!
    ).subscribe({
      next: (res: any) => {
        const lista: HistoricoItem[] = Array.isArray(res) ? res : (res?.itens ?? []);
        this.itens.set(lista);
        this.buscado.set(true);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.buscado.set(true);
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/inventario']);
  }

  // ── Helpers de tendência ───────────────────────────────────────────────────
  tendenciaIcon(t: string | null): string {
    if (!t) return 'remove';
    if (t === 'EVOLUCAO')     return 'trending_up';
    if (t === 'DEGRADACAO')   return 'trending_down';
    return 'trending_flat';
  }

  tendenciaClass(t: string | null): string {
    if (!t) return 'neutro';
    if (t === 'EVOLUCAO')   return 'evolucao';
    if (t === 'DEGRADACAO') return 'degradacao';
    return 'estabilidade';
  }

  tendenciaLabel(t: string | null): string {
    if (!t) return 'Sem comparativo anterior';
    if (t === 'EVOLUCAO')     return 'Evolução';
    if (t === 'DEGRADACAO')   return 'Degradação';
    return 'Estabilidade';
  }

  estadoLabel(val: string): string {
    const m: Record<string, string> = {
      OTIMO: 'Ótimo', BOM: 'Bom', REGULAR: 'Regular', CRITICO: 'Crítico'
    };
    return m[val] ?? val;
  }

  estadoColor(val: string): string {
    const m: Record<string, string> = {
      OTIMO: 'otimo', BOM: 'bom', REGULAR: 'regular', CRITICO: 'critico'
    };
    return m[val] ?? '';
  }

  formatDap(val: number | null): string {
    if (val == null) return '—';
    return `${Number(val).toFixed(1)} cm`;
  }

  formatVariacao(val: number | null): string {
    if (val == null) return '—';
    const v = Number(val).toFixed(1);
    return val > 0 ? `+${v} cm` : `${v} cm`;
  }

  isPrimeiraVistoria(item: HistoricoItem): boolean {
    return item.tendencia == null && item.variacaoDap == null;
  }
}
