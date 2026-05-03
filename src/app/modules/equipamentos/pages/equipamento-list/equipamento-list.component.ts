import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { EquipamentoService } from '../../../../core/services/equipamento.service';
import { NotificationService } from '../../../../core/services/notification.service';
import {
  Equipamento,
  EquipamentoAlerta,
  EquipamentoPage,
  EquipamentoQueryParams
} from '../../../../core/models/equipamento.model';

type EquipamentosTab = 'lista' | 'alertas';

@Component({
  selector: 'app-equipamento-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatPaginatorModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTableModule,
    MatTabsModule,
    MatTooltipModule
  ],
  templateUrl: './equipamento-list.component.html',
  styleUrl: './equipamento-list.component.scss'
})
export class EquipamentoListComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(EquipamentoService);
  private readonly notification = inject(NotificationService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly displayedColumns = [
    'nome',
    'categoria',
    'status',
    'localizacao',
    'estoque',
    'alerta'
  ];
  readonly pageSizeOptions = [5, 10, 25, 50];
  readonly statusOptions = ['ATIVO', 'MANUTENCAO', 'INATIVO', 'DISPONIVEL', 'EM_USO'];
  readonly categoriaOptions = ['EQUIPAMENTO', 'INSUMO', 'FERRAMENTA', 'EPI', 'VEICULO'];
  readonly filterForm = this.fb.group({
    categoria: [''],
    status: [''],
    localizacao: ['']
  });

  equipamentos: Equipamento[] = [];
  alertasEstoque: EquipamentoAlerta[] = [];
  loadingLista = false;
  loadingAlertas = false;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  activeTabIndex = 0;
  emptyMessage = 'Nenhum equipamento encontrado para os filtros informados.';
  emptyAlertasMessage = 'Nenhum item abaixo do estoque mínimo no momento.';

  private readonly destroy$ = new Subject<void>();

  ngOnInit(): void {
    this.filterForm.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
        takeUntil(this.destroy$)
      )
      .subscribe((value) => {
        this.updateQueryParams({
          categoria: value.categoria || null,
          status: value.status || null,
          localizacao: value.localizacao || null,
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

        this.filterForm.patchValue({
          categoria: parsed.categoria ?? '',
          status: parsed.status ?? '',
          localizacao: parsed.localizacao ?? ''
        }, { emitEvent: false });

        this.loadEquipamentos({
          categoria: parsed.categoria,
          status: parsed.status,
          localizacao: parsed.localizacao,
          page: parsed.page,
          size: parsed.size
        });

        if (!this.alertasEstoque.length && !this.loadingAlertas) {
          this.loadAlertas();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTabChange(index: number): void {
    this.updateQueryParams({ tab: index === 1 ? 'alertas' : 'lista' });
  }

  onPageChange(event: PageEvent): void {
    this.updateQueryParams({
      page: event.pageIndex,
      size: event.pageSize
    });
  }

  clearFilters(): void {
    this.filterForm.reset({
      categoria: '',
      status: '',
      localizacao: ''
    });
  }

  novoEquipamento(): void {
    this.router.navigate(['novo'], { relativeTo: this.route });
  }

  editarEquipamento(item: Equipamento): void {
    if (item.id == null) {
      this.notification.error('Equipamento sem identificador válido.');
      return;
    }

    this.router.navigate(['editar', item.id], { relativeTo: this.route });
  }

  get totalAlertas(): number {
    return this.alertasEstoque.length;
  }

  get categoriaSuggestions(): string[] {
    const fromData = this.equipamentos.map((item) => item.categoria);
    return this.uniqueNonEmpty([...this.categoriaOptions, ...fromData]);
  }

  get statusSuggestions(): string[] {
    const fromData = this.equipamentos.map((item) => item.status);
    return this.uniqueNonEmpty([...this.statusOptions, ...fromData]);
  }

  isEstoqueCritico(percentual: number): boolean {
    return percentual <= 20;
  }

  getStockTone(percentual: number): 'danger' | 'warning' | 'success' {
    if (percentual <= 20) {
      return 'danger';
    }

    if (percentual <= 50) {
      return 'warning';
    }

    return 'success';
  }

  statusLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }

  trackByEquipamento(_index: number, item: Equipamento): number | string | null {
    return item.id;
  }

  trackByAlerta(_index: number, item: EquipamentoAlerta): number | string | null {
    return item.id;
  }

  private loadEquipamentos(query: EquipamentoQueryParams): void {
    this.loadingLista = true;
    this.emptyMessage = 'Nenhum equipamento encontrado para os filtros informados.';

    this.service.listar(query).subscribe({
      next: (page: EquipamentoPage) => {
        this.equipamentos = page.content;
        this.totalElements = page.totalElements;
        this.pageIndex = page.page;
        this.pageSize = page.size;
        this.loadingLista = false;
      },
      error: () => {
        this.equipamentos = [];
        this.totalElements = 0;
        this.loadingLista = false;
        this.emptyMessage = 'Não foi possível carregar a listagem de equipamentos.';
        this.notification.error('Falha ao carregar equipamentos e insumos.');
      }
    });
  }

  private loadAlertas(): void {
    this.loadingAlertas = true;
    this.emptyAlertasMessage = 'Nenhum item abaixo do estoque mínimo no momento.';

    this.service.listarAlertasEstoque().subscribe({
      next: (items) => {
        this.alertasEstoque = items;
        this.loadingAlertas = false;
      },
      error: () => {
        this.alertasEstoque = [];
        this.loadingAlertas = false;
        this.emptyAlertasMessage = 'Não foi possível carregar os alertas de estoque.';
        this.notification.error('Falha ao carregar os alertas de estoque.');
      }
    });
  }

  private parseQueryParams(params: ParamMap): {
    tab: EquipamentosTab;
    categoria: string | null;
    status: string | null;
    localizacao: string | null;
    page: number;
    size: number;
  } {
    return {
      tab: params.get('tab') === 'alertas' ? 'alertas' : 'lista',
      categoria: params.get('categoria') || null,
      status: params.get('status') || null,
      localizacao: params.get('localizacao') || null,
      page: this.parsePositiveNumber(params.get('page'), 0),
      size: this.parsePositiveNumber(params.get('size'), 10)
    };
  }

  private updateQueryParams(changes: {
    tab?: EquipamentosTab;
    categoria?: string | null;
    status?: string | null;
    localizacao?: string | null;
    page?: number;
    size?: number;
  }): void {
    const current = this.parseQueryParams(this.route.snapshot.queryParamMap);
    const queryParams: Params = {
      tab: Object.prototype.hasOwnProperty.call(changes, 'tab') ? changes.tab : current.tab,
      categoria: Object.prototype.hasOwnProperty.call(changes, 'categoria') ? changes.categoria : current.categoria,
      status: Object.prototype.hasOwnProperty.call(changes, 'status') ? changes.status : current.status,
      localizacao: Object.prototype.hasOwnProperty.call(changes, 'localizacao') ? changes.localizacao : current.localizacao,
      page: Object.prototype.hasOwnProperty.call(changes, 'page') ? changes.page : current.page,
      size: Object.prototype.hasOwnProperty.call(changes, 'size') ? changes.size : current.size
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

  private uniqueNonEmpty(values: string[]): string[] {
    return [...new Set(values.filter((value) => !!value && value !== '-'))];
  }
}
