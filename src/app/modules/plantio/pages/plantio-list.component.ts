import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { take } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PlantioService } from '../plantio.service';
import {
  AreaPlantioOption,
  ColaboradorPlantioOption,
  EspeciePlantioOption,
  PlantioQueryParams,
  PlantioResponse
} from '../models/plantio.model';

@Component({
  selector: 'app-plantio-list',
  standalone: false,
  templateUrl: './plantio-list.component.html',
  styleUrl: './plantio-list.component.scss'
})
export class PlantioListComponent implements OnInit {
  private readonly plantioService = inject(PlantioService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  loading = signal(false);
  plantios = signal<PlantioResponse[]>([]);
  totalItems = signal(0);
  pageIndex = signal(0);
  pageSize = signal(10);
  areas = signal<AreaPlantioOption[]>([]);
  especies = signal<EspeciePlantioOption[]>([]);
  colaboradores = signal<ColaboradorPlantioOption[]>([]);
  currentUserId = signal<string | null>(null);
  isAdmin = signal(false);

  displayedColumns = computed(() =>
    this.isAdmin()
      ? ['protocolo', 'dataHora', 'areaFlorestalNome', 'especieNome', 'quantidadeMudas', 'colaboradorNome', 'metodoPlantio', 'houveChuva']
      : ['protocolo', 'dataHora', 'areaFlorestalNome', 'especieNome', 'quantidadeMudas', 'metodoPlantio', 'houveChuva']
  );

  filtros = this.fb.group({
    area: [''],
    especie: [''],
    colaboradorId: [''],
    dataInicio: [null as Date | null],
    dataFim: [null as Date | null]
  });

  ngOnInit(): void {
    this.authService.currentUser$.pipe(take(1)).subscribe((user) => {
      const isAdmin = user?.role === 'ROLE_ADMIN';
      this.isAdmin.set(isAdmin);
      this.currentUserId.set(user?.colaboradorId ?? null);
      if (!isAdmin) {
        this.filtros.patchValue({ colaboradorId: user?.colaboradorId ?? '' }, { emitEvent: false });
      }
      this.buscar();
    });

    this.carregarFiltros();
  }

  buscar(): void {
    this.loading.set(true);
    const f = this.filtros.getRawValue();

    const query: PlantioQueryParams = {
      area: f.area || null,
      especie: f.especie || null,
      colaboradorId: this.isAdmin() ? (f.colaboradorId || null) : this.currentUserId(),
      dataInicio: f.dataInicio ? `${this.formatDate(f.dataInicio)}T00:00:00` : null,
      dataFim: f.dataFim ? `${this.formatDate(f.dataFim)}T23:59:59` : null,
      page: this.pageIndex(),
      size: this.pageSize()
    };

    this.plantioService.listar(query).subscribe({
      next: (page) => {
        this.plantios.set(page.content);
        this.totalItems.set(page.totalElements);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Nao foi possivel carregar a listagem de plantios.');
      }
    });
  }

  limparFiltros(): void {
    this.filtros.reset({
      area: '',
      especie: '',
      colaboradorId: this.isAdmin() ? '' : (this.currentUserId() ?? ''),
      dataInicio: null,
      dataFim: null
    });
    this.pageIndex.set(0);
    this.buscar();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.buscar();
  }

  novoPlantio(): void {
    this.router.navigate(['/plantio/novo']);
  }

  metodoLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }

  private carregarFiltros(): void {
    this.plantioService.listarAreasAtivas().subscribe({
      next: (areas) => this.areas.set(areas)
    });

    this.plantioService.listarEspeciesAtivas().subscribe({
      next: (especies) => this.especies.set(especies)
    });

    if (!this.isAdmin()) {
      return;
    }

    this.plantioService.listarColaboradores().subscribe({
      next: (colaboradores) => this.colaboradores.set(colaboradores)
    });
  }

  private formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
}
