import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../core/services/notification.service';
import { ColaboradorService } from '../colaborador.service';
import { Colaborador } from '../models/Colaborador';

@Component({
  selector: 'app-colaborador-detail',
  standalone: true,
  imports: [CommonModule, DatePipe, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './colaborador-detail.component.html',
  styleUrl: './colaborador-detail.component.scss'
})
export class ColaboradorDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly notificationService = inject(NotificationService);

  colaborador: Colaborador | null = null;
  loading = true;

  ngOnInit(): void {
    const stateColaborador = history.state?.['colaborador'] as Colaborador | undefined;
    const id = this.route.snapshot.paramMap.get('id');

    if (stateColaborador) {
      this.colaborador = stateColaborador;
    }

    if (!id) {
      this.loading = false;
      this.notificationService.error('Colaborador invalido.');
      return;
    }

    this.colaboradorService.buscarPorId(id).subscribe({
      next: (colaborador) => {
        this.colaborador = colaborador;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Nao foi possivel carregar os detalhes do colaborador.');
      }
    });
  }

  editar(): void {
    if (!this.colaborador?.id) return;
    this.router.navigate(['/colaboradores', this.colaborador.id, 'editar'], {
      state: { colaborador: this.colaborador }
    });
  }

  alternarStatus(): void {
    if (!this.colaborador?.id) return;

    const ativar = this.colaborador.status === 'INATIVO';
    const request$ = ativar
      ? this.colaboradorService.reativar(this.colaborador.id)
      : this.colaboradorService.inativar(this.colaborador.id);

    request$.subscribe({
      next: () => {
        if (!this.colaborador) return;
        this.colaborador.status = ativar ? 'ATIVO' : 'INATIVO';
        this.notificationService.success(
          ativar ? 'Colaborador reativado com sucesso.' : 'Colaborador inativado com sucesso.'
        );
      },
      error: () => {
        this.notificationService.error(
          ativar ? 'Nao foi possivel reativar o colaborador.' : 'Nao foi possivel inativar o colaborador.'
        );
      }
    });
  }
}
