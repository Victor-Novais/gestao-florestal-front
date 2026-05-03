import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { NotificationService } from '../../../core/services/notification.service';
import {
  RelatorioEspecieAlertaDTO,
  RelatorioEspecieFichaDTO,
  RelatorioEspecieFichaPageDTO,
  RelatorioEspecieFichaQueryParams
} from '../models/relatorio.model';
import { RelatorioEspeciesService } from '../services/relatorio-especies.service';

type ReportTab = 'fichas' | 'alertas';
type SortField = 'nomeCientifico' | 'statusConservacao';

@Component({
  selector: 'app-especies-relatorio',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePipe,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSortModule,
    MatTableModule,
    MatTabsModule
  ],
  templateUrl: './especies-relatorio.component.html',
  styleUrl: './especies-relatorio.component.scss'
})
export class EspeciesRelatorioComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);

  readonly displayedFichaColumns = [
    'nomeCientifico',
    'nomePopular',
    'familiaBotanica',
    'porte',
    'statusConservacao',
    'ativo'
  ];
  readonly displayedAlertaColumns = [
    'nomeCientifico',
    'nomePopular',
    'statusConservacao',
    'dataIdentificacao',
    'totalAreas'
  ];
  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly statusConservacaoOptions = [
    'AMEACADA',
    'VULNERAVEL',
    'POUCO_PREOCUPANTE',
    'EXTINTA_NA_NATUREZA'
  ];
  readonly filterForm = this.fb.group({
    statusConservacao: ['']
  });

  fichas: RelatorioEspecieFichaDTO[] = [];
  alertas: RelatorioEspecieAlertaDTO[] = [];
  loadingFichas = false;
  loadingAlertas = false;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  activeTabIndex = 0;
  activeSort: SortField = 'nomeCientifico';
  sortDirection: SortDirection = 'asc';
  fichaEmptyMessage = 'Nenhuma ficha técnica encontrada para os filtros informados.';
  alertaEmptyMessage = 'Nenhuma espécie ameaçada ativa encontrada no momento.';

  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly service: RelatorioEspeciesService,
    private readonly notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this.updateQueryParams({
          statusConservacao: value.statusConservacao || null,
          page: 0
        });
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        const parsed = this.parseQueryParams(params);
        this.activeTabIndex = parsed.tab === 'alertas' ? 1 : 0;
        this.pageIndex = parsed.page;
        this.pageSize = parsed.size;
        this.activeSort = parsed.sortField;
        this.sortDirection = parsed.sortDirection;

        this.filterForm.patchValue(
          { statusConservacao: parsed.statusConservacao ?? '' },
          { emitEvent: false }
        );

        this.loadFichas({
          statusConservacao: parsed.statusConservacao,
          page: parsed.page,
          size: parsed.size,
          sort: `${parsed.sortField},${parsed.sortDirection}`
        });

        if (!this.alertas.length && !this.loadingAlertas) {
          this.loadAlertas();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.updateQueryParams({ tab: index === 1 ? 'alertas' : 'fichas' });
  }

  onSortChange(sort: Sort): void {
    const direction = (sort.direction || 'asc') as SortDirection;
    const active = this.isAllowedSortField(sort.active) ? sort.active : 'nomeCientifico';

    this.updateQueryParams({
      sort: `${active},${direction}`,
      page: 0
    });
  }

  onPageChange(event: PageEvent): void {
    this.updateQueryParams({
      page: event.pageIndex,
      size: event.pageSize
    });
  }

  clearStatusFilter(): void {
    this.filterForm.patchValue({ statusConservacao: '' });
  }

  statusLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AMEACADA':
        return 'status-ameacada';
      case 'VULNERAVEL':
        return 'status-vulneravel';
      case 'EXTINTA_NA_NATUREZA':
        return 'status-extinta';
      default:
        return 'status-default';
    }
  }

  get sortedAlertas(): RelatorioEspecieAlertaDTO[] {
    const items = [...this.alertas];

    items.sort((first, second) => {
      const left = this.activeSort === 'statusConservacao'
        ? first.statusConservacao
        : first.nomeCientifico;
      const right = this.activeSort === 'statusConservacao'
        ? second.statusConservacao
        : second.nomeCientifico;

      const result = left.localeCompare(right, 'pt-BR', { sensitivity: 'base' });
      return this.sortDirection === 'desc' ? result * -1 : result;
    });

    return items;
  }

  trackByFicha(_index: number, item: RelatorioEspecieFichaDTO): number | string | null {
    return item.id;
  }

  trackByAlerta(_index: number, item: RelatorioEspecieAlertaDTO): number | string | null {
    return item.id;
  }

  private loadFichas(query: RelatorioEspecieFichaQueryParams): void {
    this.loadingFichas = true;
    this.fichaEmptyMessage = 'Nenhuma ficha técnica encontrada para os filtros informados.';

    this.service.getFichas(query).subscribe({
      next: (page: RelatorioEspecieFichaPageDTO) => {
        this.fichas = page.content;
        this.totalElements = page.totalElements;
        this.pageIndex = page.page;
        this.pageSize = page.size;
        this.loadingFichas = false;
      },
      error: () => {
        this.fichas = [];
        this.totalElements = 0;
        this.loadingFichas = false;
        this.fichaEmptyMessage = 'Não foi possível carregar as fichas técnicas.';
        this.notificationService.error('Falha ao carregar o relatório de fichas técnicas.');
      }
    });
  }

  private loadAlertas(): void {
    this.loadingAlertas = true;
    this.alertaEmptyMessage = 'Nenhuma espécie ameaçada ativa encontrada no momento.';

    this.service.getAlertasAmeacadas().subscribe({
      next: (alertas) => {
        this.alertas = alertas;
        this.loadingAlertas = false;
      },
      error: () => {
        this.alertas = [];
        this.loadingAlertas = false;
        this.alertaEmptyMessage = 'Não foi possível carregar os alertas de espécies ameaçadas.';
        this.notificationService.error('Falha ao carregar os alertas de espécies ameaçadas.');
      }
    });
  }

  private parseQueryParams(params: ParamMap): {
    tab: ReportTab;
    statusConservacao: string | null;
    page: number;
    size: number;
    sortField: SortField;
    sortDirection: SortDirection;
  } {
    const tab = params.get('tab') === 'alertas' ? 'alertas' : 'fichas';
    const statusConservacao = params.get('statusConservacao') || null;
    const page = this.parsePositiveNumber(params.get('page'), 0);
    const size = this.parsePositiveNumber(params.get('size'), 10);
    const [rawField, rawDirection] = (params.get('sort') || 'nomeCientifico,asc').split(',');

    return {
      tab,
      statusConservacao,
      page,
      size,
      sortField: this.isAllowedSortField(rawField) ? rawField : 'nomeCientifico',
      sortDirection: rawDirection === 'desc' ? 'desc' : 'asc'
    };
  }

  private updateQueryParams(changes: {
    tab?: ReportTab;
    statusConservacao?: string | null;
    page?: number;
    size?: number;
    sort?: string;
  }): void {
    const current = this.parseQueryParams(this.route.snapshot.queryParamMap);
    const queryParams: Params = {
      tab: Object.prototype.hasOwnProperty.call(changes, 'tab') ? changes.tab : current.tab,
      statusConservacao: Object.prototype.hasOwnProperty.call(changes, 'statusConservacao')
        ? changes.statusConservacao
        : current.statusConservacao,
      page: Object.prototype.hasOwnProperty.call(changes, 'page') ? changes.page : current.page,
      size: Object.prototype.hasOwnProperty.call(changes, 'size') ? changes.size : current.size,
      sort: Object.prototype.hasOwnProperty.call(changes, 'sort')
        ? changes.sort
        : `${current.sortField},${current.sortDirection}`
    };

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }

  private parsePositiveNumber(value: string | null, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return fallback;
    }

    return parsed;
  }

  private isAllowedSortField(value: string | null): value is SortField {
    return value === 'nomeCientifico' || value === 'statusConservacao';
  }
}
