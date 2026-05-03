import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AreaFlorestal } from '../area-florestal.model';
import { AreaFlorestalService } from '../area-florestal.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-area-florestal-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './area-florestal-detail.component.html',
  styleUrl: './area-florestal-detail.component.scss'
})
export class AreaFlorestalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly areaService = inject(AreaFlorestalService);
  private readonly notificationService = inject(NotificationService);

  area: AreaFlorestal | null = (history.state?.area as AreaFlorestal | undefined) ?? null;
  loading = true;

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.loading = false;
      this.notificationService.error('Area florestal invalida.');
      return;
    }

    if (this.area && `${this.area.id}` === id) {
      this.loading = false;
      return;
    }

    this.areaService.getAreaById(id).subscribe({
      next: (area) => {
        this.area = area;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Nao foi possivel carregar os detalhes da area.');
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

  getStatusLabel(value: string): string {
    return value.replace(/_/g, ' ');
  }

  voltar(): void {
    this.router.navigate(['/areas']);
  }
}
