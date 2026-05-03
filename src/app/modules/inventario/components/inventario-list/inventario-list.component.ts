import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';

import { MatTableModule }           from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatChipsModule }           from '@angular/material/chips';
import { MatProgressBarModule }     from '@angular/material/progress-bar';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';
import { MatCardModule }            from '@angular/material/card';

import { InventarioService }   from '../../services/inventario.service';
import { InventarioResponse }  from '../../models/inventario.model';
import { AuthService }         from '../../../../core/services/auth.service';

@Component({
  selector: 'app-inventario-list',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatTableModule, MatPaginatorModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, MatButtonModule, MatIconModule, MatChipsModule,
    MatProgressBarModule, MatTooltipModule, MatDatepickerModule,
    MatNativeDateModule, MatCardModule,
  ],
  templateUrl: './inventario-list.component.html',
  styleUrl: './inventario-list.component.scss',
})
export class InventarioListComponent implements OnInit {

  private svc    = inject(InventarioService);
  private router = inject(Router);
  private fb     = inject(FormBuilder);
  private auth   = inject(AuthService);

  loading      = signal(false);
  inventarios  = signal<InventarioResponse[]>([]);
  totalItems   = signal(0);
  pageIndex    = signal(0);
  pageSize     = signal(10);
  areas        = signal<any[]>([]);

  isAdmin = false;

  displayedColumns = ['numeroParcela', 'areaFlorestalNome', 'dataVistoria',
                      'estadoGeral', 'colaboradorNome', 'acoes'];

  filtros = this.fb.group({
    area:        [''],
    estado:      [''],
    dataInicio:  [null as Date | null],
    dataFim:     [null as Date | null],
  });

  readonly estadosGerais = [
    { value: '',        label: 'Todos' },
    { value: 'OTIMO',   label: 'Ótimo' },
    { value: 'BOM',     label: 'Bom' },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'CRITICO', label: 'Crítico' },
  ];

  ngOnInit(): void {
    this.auth.currentUser$.subscribe((u) => {
      this.isAdmin = u?.role === 'ROLE_ADMIN';
    });
    this.carregarAreas();
    this.buscar();
  }

  private carregarAreas(): void {
    this.svc.listarAreasAtivas().subscribe({
      next: (res: any) => this.areas.set(res?.content ?? res ?? []),
    });
  }

  buscar(): void {
    this.loading.set(true);
    const f = this.filtros.getRawValue();

    const params: any = {
      page: this.pageIndex(),
      size: this.pageSize(),
    };
    if (f.area)       params.area = f.area;
    if (f.estado)     params.estado = f.estado;
    if (f.dataInicio) params.dataInicio = this.formatDate(f.dataInicio!);
    if (f.dataFim)    params.dataFim    = this.formatDate(f.dataFim!);

    this.svc.listar(params).subscribe({
      next: (res: any) => {
        this.inventarios.set(res?.content ?? []);
        this.totalItems.set(res?.totalElements ?? 0);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  limparFiltros(): void {
    this.filtros.reset({ area: '', estado: '', dataInicio: null, dataFim: null });
    this.pageIndex.set(0);
    this.buscar();
  }

  onPage(e: PageEvent): void {
    this.pageIndex.set(e.pageIndex);
    this.pageSize.set(e.pageSize);
    this.buscar();
  }

  verDetalhe(id: string): void {
    this.router.navigate(['/inventario', id]);
  }

  novoInventario(): void {
    this.router.navigate(['/inventario/novo']);
  }

  verHistorico(): void {
    this.router.navigate(['/inventario/historico/parcela']);
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

  private formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }
}
