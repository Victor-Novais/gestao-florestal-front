import { AfterViewInit, Component, OnDestroy, ViewChild } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

import { NotificationService } from '../../../core/services/notification.service';
import { ColaboradorService } from '../colaborador.service';
import {
  Colaborador,
  ColaboradorPage,
  ColaboradorQueryParams,
  ColaboradorStatus
} from '../models/Colaborador';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-colaborador-list',
  standalone: false,
  templateUrl: './colaborador-list.component.html',
  styleUrl: './colaborador-list.component.scss'
})
export class ColaboradorListComponent implements AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator) paginator!: MatPaginator;

  readonly displayedColumns = ['nome', 'cpf', 'matricula', 'funcao', 'areaAtuacao', 'status', 'acoes'];
  readonly funcaoOptions = [
    'ENGENHEIRO FLORESTAL',
    'TECNICO DE CAMPO',
    'ANALISTA AMBIENTAL',
    'SUPERVISOR',
    'OPERADOR DE MAQUINAS',
    'AUXILIAR FLORESTAL'
  ];
  readonly statusOptions = ['ATIVO', 'INATIVO'];

  readonly filterForm;

  colaboradores: Colaborador[] = [];
  isLoading = false;
  totalElements = 0;
  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];
  emptyMessage = 'Nenhum colaborador encontrado para os filtros informados.';

  private readonly destroy$ = new Subject<void>();
  private requestSubscription?: Subscription;

  constructor(
    private readonly fb: FormBuilder,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly colaboradorService: ColaboradorService,
    private readonly notificationService: NotificationService,
    private readonly dialog: MatDialog
  ) {
    this.filterForm = this.fb.group({
      funcao: [''],
      areaAtuacao: [''],
      status: ['']
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
        this.loadColaboradores();
      });
  }

  ngAfterViewInit(): void {
    this.loadColaboradores();
  }

  ngOnDestroy(): void {
    this.requestSubscription?.unsubscribe();
    this.destroy$.next();
    this.destroy$.complete();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadColaboradores();
  }

  onCriar(): void {
    this.router.navigate(['novo'], { relativeTo: this.route });
  }

  onVisualizar(colaborador: Colaborador): void {
    this.router.navigate([`${colaborador.id}`], {
      relativeTo: this.route,
      state: { colaborador }
    });
  }

  onEditar(colaborador: Colaborador): void {
    this.router.navigate([`${colaborador.id}`, 'editar'], {
      relativeTo: this.route,
      state: { colaborador }
    });
  }

  onAlternarStatus(colaborador: Colaborador): void {
    if (colaborador.id == null) {
      this.notificationService.error('Colaborador sem identificador valido.');
      return;
    }

    const ativar = colaborador.status === 'INATIVO';
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: ativar ? 'Reativar Colaborador' : 'Inativar Colaborador',
        message: ativar
          ? `Deseja reativar o colaborador "${colaborador.nome}"?`
          : `Deseja inativar o colaborador "${colaborador.nome}"? Isso bloqueará o login do usuário vinculado.`
      }
    });

    dialogRef.afterClosed().subscribe((confirmed: boolean) => {
      if (!confirmed) {
        return;
      }

      const request$ = ativar
        ? this.colaboradorService.reativar(colaborador.id!)
        : this.colaboradorService.inativar(colaborador.id!);

      request$.subscribe({
        next: () => {
          colaborador.status = ativar ? 'ATIVO' : 'INATIVO';
          this.notificationService.success(
            ativar
              ? `Colaborador "${colaborador.nome}" reativado com sucesso.`
              : `Colaborador "${colaborador.nome}" inativado com sucesso.`
          );
        },
        error: () => {
          this.notificationService.error(
            ativar
              ? 'Nao foi possivel reativar o colaborador.'
              : 'Nao foi possivel inativar o colaborador.'
          );
        }
      });
    });
  }

  trackByColaborador(_index: number, colaborador: Colaborador): number | string | null {
    return colaborador.id;
  }

  getStatusLabel(status: string): string {
    return status === 'ATIVO' ? 'Ativo' : 'Inativo';
  }

  getStatusClass(status: string): string {
    return status === 'ATIVO' ? 'status-ativo' : 'status-inativo';
  }

  private loadColaboradores(): void {
    this.requestSubscription?.unsubscribe();
    this.isLoading = true;
    this.emptyMessage = 'Nenhum colaborador encontrado para os filtros informados.';

    this.requestSubscription = this.colaboradorService.listColaboradores(this.buildQuery()).subscribe({
      next: (page: ColaboradorPage) => {
        this.colaboradores = page.content;
        this.totalElements = page.totalElements;
        this.pageIndex = page.page;
        this.pageSize = page.size;
        this.isLoading = false;
      },
      error: () => {
        this.colaboradores = [];
        this.totalElements = 0;
        this.isLoading = false;
        this.emptyMessage = 'Nao foi possivel carregar os colaboradores.';
        this.notificationService.error('Falha ao carregar a listagem de colaboradores.');
      }
    });
  }

  private buildQuery(): ColaboradorQueryParams {
    const { funcao, areaAtuacao, status } = this.filterForm.getRawValue();

    return {
      funcao: funcao || null,
      areaAtuacao: areaAtuacao || null,
      status: (status || null) as ColaboradorStatus | null,
      page: this.pageIndex,
      size: this.pageSize
    };
  }
}
