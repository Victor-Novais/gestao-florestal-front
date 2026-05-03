import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { MatCardModule }            from '@angular/material/card';
import { MatIconModule }            from '@angular/material/icon';
import { MatButtonModule }          from '@angular/material/button';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule }           from '@angular/material/chips';
import { MatDividerModule }         from '@angular/material/divider';
import { MatTabsModule }            from '@angular/material/tabs';
import { MatTooltipModule }         from '@angular/material/tooltip';

import { AuthService }   from '../../../core/services/auth.service';
import {
  HistoricoColaboradorService,
  ColaboradorSimples,
  TimelineMes,
  EscalaColaborador,
} from './historico-colaborador.service';

// Formato de datepicker apenas mês/ano
export const MONTH_YEAR_FORMATS = {
  parse:   { dateInput: 'MM/YYYY' },
  display: { dateInput: 'MM/YYYY', monthYearLabel: 'MMM YYYY',
             dateA11yLabel: 'LL', monthYearA11yLabel: 'MMMM YYYY' },
};

@Component({
  selector: 'app-historico-colaborador',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatCardModule, MatIconModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatDatepickerModule, MatNativeDateModule,
    MatProgressSpinnerModule, MatChipsModule,
    MatDividerModule, MatTabsModule, MatTooltipModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    { provide: MAT_DATE_FORMATS, useValue: MONTH_YEAR_FORMATS },
  ],
  templateUrl: './historico-colaborador.component.html',
  styleUrl:    './historico-colaborador.component.scss'
})
export class HistoricoColaboradorComponent implements OnInit {

  private svc  = inject(HistoricoColaboradorService);
  private auth = inject(AuthService);
  private fb   = inject(FormBuilder);

  isAdmin = signal(false);

  colaboradores  = signal<ColaboradorSimples[]>([]);
  timeline       = signal<TimelineMes[]>([]);
  escala         = signal<EscalaColaborador[]>([]);

  loadingTimeline = signal(false);
  loadingEscala   = signal(false);

  colaboradorSelecionado = signal<string | null>(null);

  filtroTimeline = this.fb.group({
    colaboradorId: [''],
  });

  filtroEscala = this.fb.group({
    mesAno: [new Date()],
  });

  ngOnInit(): void {
    // Detectar se é admin
    this.auth.currentUser$.subscribe((u) => {
      const admin = u?.role === 'ROLE_ADMIN';
      this.isAdmin.set(admin);

      if (admin) {
        // Admin: carrega lista de colaboradores para o seletor
        this.svc.listarColaboradores().subscribe(cols => {
          this.colaboradores.set(cols);
        });
      } else {
        // Colaborador: carrega o próprio histórico automaticamente
        const colaboradorId = u?.colaboradorId ?? '';
        this.filtroTimeline.patchValue({ colaboradorId });
        this.carregarTimeline(colaboradorId);
      }
    });

    // Escala do mês atual
    this.carregarEscala();
  }

  carregarTimeline(idOverride?: string): void {
    const id = idOverride ?? this.filtroTimeline.value.colaboradorId ?? '';
    if (!id) return;
    this.colaboradorSelecionado.set(id);
    this.loadingTimeline.set(true);
    this.svc.getTimeline(id).subscribe({
      next: t => { this.timeline.set(t); this.loadingTimeline.set(false); },
      error: () => this.loadingTimeline.set(false),
    });
  }

  carregarEscala(): void {
    const d = this.filtroEscala.value.mesAno ?? new Date();
    this.loadingEscala.set(true);
    this.svc.getEscalaAlocacao(d.getMonth() + 1, d.getFullYear()).subscribe({
      next: e => { this.escala.set(e); this.loadingEscala.set(false); },
      error: () => this.loadingEscala.set(false),
    });
  }

  // ── Helpers de template ───────────────────────────────────────────────────
  tipoIcon(tipo: string): string {
    if (tipo === 'PLANTIO')    return 'grass';
    if (tipo === 'INVENTARIO') return 'inventory';
    return 'warning_amber';
  }

  tipoColor(tipo: string): string {
    if (tipo === 'PLANTIO')    return '#2E7D32';
    if (tipo === 'INVENTARIO') return '#01579B';
    return '#E65100';
  }

  colaboradorNome(id: string): string {
    return this.colaboradores().find(c => c.id === id)?.nomeCompleto ?? id;
  }

  maxAtividades(): number {
    return Math.max(...this.escala().map(e => e.totalAtividades), 1);
  }

  barWidth(e: EscalaColaborador): number {
    return Math.round((e.totalAtividades / this.maxAtividades()) * 100);
  }
}
