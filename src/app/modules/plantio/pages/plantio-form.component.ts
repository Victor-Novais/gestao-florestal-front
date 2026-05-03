import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { NotificationService } from '../../../core/services/notification.service';
import { PlantioService } from '../plantio.service';
import { AreaPlantioOption, EspeciePlantioOption, PlantioRequest } from '../models/plantio.model';
import { PlantioProtocoloDialogComponent } from './plantio-protocolo-dialog.component';

@Component({
  selector: 'app-plantio-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDialogModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatTooltipModule
  ],
  templateUrl: './plantio-form.component.html',
  styleUrl: './plantio-form.component.scss'
})
export class PlantioFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly plantioService = inject(PlantioService);
  private readonly notificationService = inject(NotificationService);
  private readonly dialog = inject(MatDialog);

  loading = signal(false);
  areas = signal<AreaPlantioOption[]>([]);
  especies = signal<EspeciePlantioOption[]>([]);

  readonly metodosPlantio = [
    { value: 'MANUAL', label: 'Manual' },
    { value: 'MECANIZADO', label: 'Mecanizado' },
    { value: 'SEMEADURA_DIRETA', label: 'Semeadura Direta' },
    { value: 'HIDROSSEMEADURA', label: 'Hidrossemeadura' }
  ];

  readonly form = this.fb.group({
    dataHora: ['', [Validators.required]],
    areaFlorestalId: ['', [Validators.required]],
    especieId: ['', [Validators.required]],
    quantidadeMudas: ['', [Validators.required, this.integerGreaterThanZeroValidator()]],
    latitudeTalhao: ['', [Validators.required]],
    longitudeTalhao: ['', [Validators.required]],
    temperatura: ['', [Validators.required]],
    umidade: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
    houveChuva: [false],
    metodoPlantio: ['', [Validators.required]],
    observacoes: ['']
  });

  ngOnInit(): void {
    this.carregarOpcoes();
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const raw = this.form.getRawValue();
    const payload: PlantioRequest = {
      dataHora: `${raw.dataHora ?? ''}`,
      areaFlorestalId: `${raw.areaFlorestalId ?? ''}`,
      especieId: `${raw.especieId ?? ''}`,
      quantidadeMudas: Number(raw.quantidadeMudas),
      latitudeTalhao: Number(raw.latitudeTalhao),
      longitudeTalhao: Number(raw.longitudeTalhao),
      temperatura: Number(raw.temperatura),
      umidade: Number(raw.umidade),
      houveChuva: !!raw.houveChuva,
      metodoPlantio: `${raw.metodoPlantio ?? ''}`,
      observacoes: `${raw.observacoes ?? ''}`.trim()
    };

    this.plantioService.criar(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.dialog.open(PlantioProtocoloDialogComponent, {
          data: { protocolo: res.protocolo || res.id },
          width: '420px',
          maxWidth: 'calc(100vw - 1rem)',
          panelClass: ['responsive-dialog-panel', 'responsive-dialog-panel--narrow'],
          disableClose: true
        });
      },
      error: () => {
        this.loading.set(false);
        this.notificationService.error('Nao foi possivel registrar o plantio.');
      }
    });
  }

  cancelar(): void {
    this.router.navigate(['/plantio']);
  }

  fieldError(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Campo obrigatorio.';
    if (control.hasError('integerPositive')) return 'Informe um inteiro maior que zero.';
    if (control.hasError('min')) return 'Informe um valor valido.';
    if (control.hasError('max')) return 'Informe um valor ate 100.';
    return '';
  }

  private carregarOpcoes(): void {
    this.plantioService.listarAreasAtivas().subscribe({
      next: (areas) => this.areas.set(areas),
      error: () => this.notificationService.error('Nao foi possivel carregar as areas florestais ativas.')
    });

    this.plantioService.listarEspeciesAtivas().subscribe({
      next: (especies) => this.especies.set(especies),
      error: () => this.notificationService.error('Nao foi possivel carregar as especies ativas.')
    });
  }

  private integerGreaterThanZeroValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const value = Number(control.value);
      if (!Number.isInteger(value) || value <= 0) {
        return { integerPositive: true };
      }
      return null;
    };
  }
}
