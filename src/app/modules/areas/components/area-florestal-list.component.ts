import {
  AfterViewInit,
  Component,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { PageEvent, MatPaginator } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { NotificationService } from '../../../core/services/notification.service';
import { AreaFlorestal, AreaFlorestalQueryParams } from '../area-florestal.model';
import { AreaFlorestalService } from '../area-florestal.service';

@Component({
  selector: 'app-area-florestal-list',
  standalone: false,
  templateUrl: './area-florestal-list.component.html',
  styleUrl: './area-florestal-list.component.scss'
})
export class AreaFlorestalListComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly displayedColumns = [
    'nome',
    'tipoFloresta',
    'bioma',
    'localizacao',
    'hectares',
    'status',
    'acoes'
  ];

  readonly statusOptions = ['ATIVA', 'INATIVA', 'EMBARGADA', 'EM RECUPERACAO'];
  readonly biomaOptions = ['AMAZONIA', 'CAATINGA', 'CERRADO', 'MATA_ATLANTICA', 'PAMPA', 'PANTANAL'];
  readonly tipoOptions = ['CONSERVACAO', 'MANEJO', 'PRODUCAO', 'RESTAURACAO'];

  readonly filterForm;

  areas: AreaFlorestal[] = [];
  isLoading = false;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];
  emptyMessage = 'Nenhuma area encontrada para os filtros informados.';

  private readonly destroy$ = new Subject<void>();
  private requestSubscription?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly areaFlorestalService: AreaFlorestalService,
    private readonly notificationService: NotificationService
  ) {
    this.filterForm = this.fb.group({
      status: [''],
      bioma: [''],
      tipo: ['']
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
        this.loadAreas();
      });
  }

  ngAfterViewInit(): void {
    Promise.resolve().then(() => this.loadAreas());
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadAreas();
  }

  onVisualizar(area: AreaFlorestal): void {
    this.router.navigate([`${area.id}`], {
      relativeTo: this.route,
      state: { area }
    });
  }

  onCriar(): void {
    this.router.navigate(['nova'], { relativeTo: this.route });
  }

  onEditar(area: AreaFlorestal): void {
    this.router.navigate([`${area.id}`, 'editar'], {
      relativeTo: this.route,
      state: { area }
    });
  }

  onAlternarStatus(area: AreaFlorestal): void {
    if (area.id == null) {
      this.notificationService.error('Area sem identificador valido.');
      return;
    }

    const ativar = area.status !== 'ATIVA';
    const confirmado = window.confirm(
      ativar
        ? `Deseja ativar a area "${area.nome}"?`
        : `Deseja inativar a area "${area.nome}"?`
    );

    if (!confirmado) {
      return;
    }

    const request$ = ativar
      ? this.areaFlorestalService.ativarArea(area.id)
      : this.areaFlorestalService.inativarArea(area.id);

    request$.subscribe({
      next: () => {
        area.status = ativar ? 'ATIVA' : 'INATIVA';
        this.notificationService.success(
          ativar
            ? `Area "${area.nome}" ativada com sucesso.`
            : `Area "${area.nome}" inativada com sucesso.`
        );
      },
      error: () => {
        this.notificationService.error(
          ativar
            ? 'Nao foi possivel ativar a area.'
            : 'Nao foi possivel inativar a area.'
        );
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'ATIVA':
        return 'status-ativa';
      case 'EMBARGADA':
        return 'status-embargada';
      case 'INATIVA':
        return 'status-inativa';
      case 'EM RECUPERACAO':
      case 'EM_RECUPERACAO':
        return 'status-recuperacao';
      default:
        return 'status-default';
    }
  }

  getStatusLabel(status: string): string {
    return status.replace(/_/g, ' ');
  }

  mapTipoFlorestaToFrontend(tipoBackend: string): string {
    const mapping: Record<string, string> = {
      'NATIVA': 'CONSERVACAO',
      'PLANTADA': 'MANEJO',
      'MISTA': 'RESTAURACAO'
    };
    return mapping[tipoBackend] || tipoBackend;
  }

  getToggleActionLabel(area: AreaFlorestal): string {
    return area.status === 'ATIVA' ? 'Inativar' : 'Ativar';
  }

  trackByArea(_index: number, area: AreaFlorestal): number | string | null {
    return area.id;
  }

  private loadAreas(): void {
    this.requestSubscription?.unsubscribe();
    this.isLoading = true;
    this.emptyMessage = 'Nenhuma area encontrada para os filtros informados.';

    this.requestSubscription = this.areaFlorestalService
      .listAreas(this.buildQuery())
      .subscribe({
        next: (page) => {
          this.areas = page.content;
          this.totalElements = page.totalElements;
          this.pageIndex = page.page;
          this.pageSize = page.size;
          this.isLoading = false;

          if (page.content.length === 0) {
            this.emptyMessage = 'Nenhuma area encontrada para os filtros informados.';
          }
        },
        error: () => {
          this.areas = [];
          this.totalElements = 0;
          this.isLoading = false;
          this.emptyMessage = 'Nao foi possivel carregar as areas florestais.';
          this.notificationService.error('Falha ao carregar a listagem de areas florestais.');
        }
      });
  }

  private buildQuery(): AreaFlorestalQueryParams {
    const { status, bioma, tipo } = this.filterForm.getRawValue();

    return {
      status: status || null,
      bioma: bioma || null,
      tipo: tipo || null,
      page: this.pageIndex,
      size: this.pageSize
    };
  }
}
