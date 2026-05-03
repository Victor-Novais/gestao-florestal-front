import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { MatCardModule }        from '@angular/material/card';
import { MatButtonModule }      from '@angular/material/button';
import { MatIconModule }        from '@angular/material/icon';
import { MatTableModule }       from '@angular/material/table';
import { MatChipsModule }       from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule }     from '@angular/material/divider';
import { MatTooltipModule }     from '@angular/material/tooltip';

import { InventarioService }  from '../../services/inventario.service';
import { InventarioResponse } from '../../models/inventario.model';

@Component({
  selector: 'app-inventario-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule, MatTableModule,
    MatChipsModule, MatProgressBarModule, MatDividerModule, MatTooltipModule,
  ],
  templateUrl: './inventario-detail.component.html',
  styleUrl: './inventario-detail.component.scss',
})
export class InventarioDetailComponent implements OnInit {

  private svc    = inject(InventarioService);
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  loading    = signal(true);
  inventario = signal<InventarioResponse | null>(null);

  especiesColumns = ['especieNome', 'especieNomeCientifico', 'quantidade', 'dapMedio', 'alturaMedia'];

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.svc.buscarPorId(id).subscribe({
      next: (res) => {
        this.inventario.set(res);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.router.navigate(['/inventario']);
      },
    });
  }

  voltar(): void {
    this.router.navigate(['/inventario']);
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

  formatAltura(val: number | null): string {
    if (val == null) return '—';
    return `${Number(val).toFixed(1)} m`;
  }
}
