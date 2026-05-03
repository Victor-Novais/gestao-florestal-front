import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { NotificationService } from '../../../core/services/notification.service';
import { PlantioConfirmacaoDTO } from '../models/relatorio.model';
import { RelatorioPlantioService } from '../services/relatorio-plantio.service';

@Component({
  selector: 'app-plantio-confirmacao',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatCardModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './plantio-confirmacao.component.html',
  styleUrl: './plantio-confirmacao.component.scss'
})
export class PlantioConfirmacaoComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly service = inject(RelatorioPlantioService);
  private readonly notification = inject(NotificationService);

  loading = signal(true);
  confirmacao = signal<PlantioConfirmacaoDTO | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      this.notification.error('Registro de plantio invalido.');
      return;
    }

    this.service.getConfirmacao(id).subscribe({
      next: (data) => {
        this.confirmacao.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.notification.error('Nao foi possivel carregar a confirmacao de plantio.');
      }
    });
  }

  imprimir(): void {
    window.print();
  }
}
