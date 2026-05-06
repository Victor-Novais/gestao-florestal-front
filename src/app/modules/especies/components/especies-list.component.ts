import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { NotificationService } from '../../../core/services/notification.service';
import { EspeciePage, EspecieQueryParams, EspecieVegetal } from '../especie.model';
import { EspecieService } from '../especie.service';

@Component({
  selector: 'app-especies-list',
  standalone: false,
  templateUrl: './especies-list.component.html',
  styleUrl: './especies-list.component.scss'
})
export class EspeciesListComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly displayedColumns = [
    'nomeCientifico',
    'nomePopular',
    'familiaBotanica',
    'porte',
    'statusConservacao',
    'alerta',
    'acoes'
  ];

  readonly statusConservacaoOptions = ['AMEACADA', 'VULNERAVEL', 'POUCO_PREOCUPANTE', 'EXTINTA_NA_NATUREZA'];
  /** Valores alinhados ao enum `Porte` da API. */
  readonly porteOptions = ['ARBOREO', 'ARBUSTIVO', 'HERBACEO'] as const;
  readonly ativoOptions = [
    { label: 'Todos', value: '' },
    { label: 'Ativas', value: 'true' },
    { label: 'Inativas', value: 'false' }
  ];

  readonly filterForm;

  especies: EspecieVegetal[] = [];
  alertas: EspecieVegetal[] = [];
  isLoading = false;
  isLoadingAlertas = false;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];
  emptyMessage = 'Nenhuma espécie encontrada para os filtros informados.';
  alertasMessage = 'Nenhuma espécie ameaçada ativa encontrada.';

  private readonly destroy$ = new Subject<void>();
  private requestSubscription?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly especieService: EspecieService,
    private readonly notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      statusConservacao: [''],
      porte: [''],
      ativo: ['']
    });

    this.filterForm.valueChanges
      .pipe(
        debounceTime(250),
        distinctUntilChanged((previous, current) => JSON.stringify(previous) === JSON.stringify(current)),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        if (this.paginator && this.pageIndex !== 0) {
          this.paginator.firstPage();
          return;
        }

        this.pageIndex = 0;
        this.loadListAndAlerts();
      });
  }

  ngAfterViewInit(): void {
    this.loadListAndAlerts();
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadEspecies();
  }

  onCriar(): void {
    this.router.navigate(['nova'], { relativeTo: this.route });
  }

  onVisualizar(especie: EspecieVegetal): void {
    this.router.navigate([`${especie.id}`], {
      relativeTo: this.route,
      state: { especie }
    });
  }

  onEditar(especie: EspecieVegetal): void {
    this.router.navigate([`${especie.id}`, 'editar'], {
      relativeTo: this.route,
      state: { especie }
    });
  }

  onAlternarStatus(especie: EspecieVegetal): void {
    if (especie.id == null) {
      this.notificationService.error('Espécie sem identificador válido.');
      return;
    }

    const ativar = !especie.ativo;
    const confirmado = window.confirm(
      ativar
        ? `Deseja ativar a espécie "${especie.nomePopular}"?`
        : `Deseja inativar a espécie "${especie.nomePopular}"?`
    );

    if (!confirmado) {
      return;
    }

    const request$ = ativar ? this.especieService.ativar(especie.id) : this.especieService.inativar(especie.id);
    request$.subscribe({
      next: () => {
        especie.ativo = ativar;
        this.notificationService.success(
          ativar
            ? `Espécie "${especie.nomePopular}" ativada com sucesso.`
            : `Espécie "${especie.nomePopular}" inativada com sucesso.`
        );
        this.loadAlertas();
      },
      error: () => {
        this.notificationService.error(
          ativar
            ? 'Não foi possível ativar a espécie.'
            : 'Não foi possível inativar a espécie.'
        );
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'AMEACADA':
        return 'status-ameacada';
      case 'VULNERAVEL':
        return 'status-vulneravel';
      case 'POUCO_PREOCUPANTE':
        return 'status-pouco-preocupante';
      default:
        return 'status-default';
    }
  }

  getToggleActionLabel(especie: EspecieVegetal): string {
    return especie.ativo ? 'Inativar' : 'Ativar';
  }

  isAmeacada(especie: EspecieVegetal): boolean {
    return especie.statusConservacao === 'AMEACADA';
  }

  getStatusLabel(value: string): string {
    const porteLabels: Record<string, string> = {
      ARBOREO: 'Arbóreo',
      ARBUSTIVO: 'Arbustivo',
      HERBACEO: 'Herbáceo'
    };
    if (porteLabels[value]) return porteLabels[value];
    return value.replace(/_/g, ' ');
  }

  trackByEspecie(_index: number, especie: EspecieVegetal): number | string | null {
    return especie.id;
  }

  private loadListAndAlerts(): void {
    this.loadEspecies();
    this.loadAlertas();
  }

  private loadEspecies(): void {
    this.requestSubscription?.unsubscribe();
    this.isLoading = true;
    this.emptyMessage = 'Nenhuma espécie encontrada para os filtros informados.';

    this.requestSubscription = this.especieService.listEspecies(this.buildQuery()).subscribe({
      next: (page: EspeciePage) => {
        this.especies = page.content;
        this.totalElements = page.totalElements;
        this.pageIndex = page.page;
        this.pageSize = page.size;
        this.isLoading = false;
      },
      error: () => {
        this.especies = [];
        this.totalElements = 0;
        this.isLoading = false;
        this.emptyMessage = 'Não foi possível carregar as espécies.';
        this.notificationService.error('Falha ao carregar a listagem de espécies.');
      }
    });
  }

  private loadAlertas(): void {
    this.isLoadingAlertas = true;
    this.alertasMessage = 'Nenhuma espécie ameaçada ativa encontrada.';

    this.especieService.listAlertas().subscribe({
      next: (alertas) => {
        this.alertas = alertas;
        this.isLoadingAlertas = false;
      },
      error: () => {
        this.alertas = [];
        this.isLoadingAlertas = false;
        this.alertasMessage = 'Não foi possível carregar os alertas de conservação.';
        this.notificationService.error('Falha ao carregar os alertas de conservação.');
      }
    });
  }

  private buildQuery(): EspecieQueryParams {
    const { statusConservacao, porte, ativo } = this.filterForm.getRawValue();

    return {
      statusConservacao: statusConservacao || null,
      porte: porte || null,
      ativo: ativo === '' ? null : ativo === 'true',
      page: this.pageIndex,
      size: this.pageSize
    };
  }
}
