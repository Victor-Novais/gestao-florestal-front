import { Component, OnInit, inject, signal } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatSelectModule }          from '@angular/material/select';
import { MatButtonModule }          from '@angular/material/button';
import { MatIconModule }            from '@angular/material/icon';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';
import { MatSlideToggleModule }     from '@angular/material/slide-toggle';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule }         from '@angular/material/divider';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatCardModule }            from '@angular/material/card';
import { MatTooltipModule }         from '@angular/material/tooltip';

import { InventarioService }       from '../../services/inventario.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AreaFlorestalOption, ColaboradorOption, EspecieOption } from '../../models/inventario.model';
import { ProtocoloDialogComponent } from '../protocolo-dialog/protocolo-dialog.component';

@Component({
  selector: 'app-inventario-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSlideToggleModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDialogModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './inventario-form.component.html',
  styleUrl: './inventario-form.component.scss',
})
export class InventarioFormComponent implements OnInit {

  private fb      = inject(FormBuilder);
  private svc     = inject(InventarioService);
  private router  = inject(Router);
  private dialog  = inject(MatDialog);
  private auth    = inject(AuthService);

  loading   = signal(false);
  areas     = signal<AreaFlorestalOption[]>([]);
  especies  = signal<EspecieOption[]>([]);
  colaboradores = signal<ColaboradorOption[]>([]);
  isAdmin = signal(false);
  maxDate   = new Date();

  readonly estadosGerais = [
    { value: 'OTIMO',   label: 'Ótimo'   },
    { value: 'BOM',     label: 'Bom'     },
    { value: 'REGULAR', label: 'Regular' },
    { value: 'CRITICO', label: 'Crítico' },
  ];

  form: FormGroup = this.fb.group({
    numeroParcela:   ['', [Validators.required, Validators.maxLength(50)]],
    areaFlorestalId: ['', Validators.required],
    dataVistoria:    [null, Validators.required],
    estadoGeral:     ['', Validators.required],
    presencaPragas:  [false],
    descricaoPragas: [''],
    colaboradorId:   [''],
    especies:        this.fb.array([], [Validators.required, this.minOneEspecie]),
  });

  // ── Getters ────────────────────────────────────────────────────────────────
  get especiesArray(): FormArray { return this.form.get('especies') as FormArray; }
  get presencaPragasCtrl()       { return this.form.get('presencaPragas')!; }
  get especiesControls(): AbstractControl[] { return this.especiesArray.controls; }

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.carregarDropdowns();
    this.configurarUsuario();

    // Toggle de pragas: limpa/desabilita o campo de descrição
    this.presencaPragasCtrl.valueChanges.subscribe((ativo: boolean) => {
      const ctrl = this.form.get('descricaoPragas')!;
      if (ativo) {
        ctrl.setValidators([Validators.maxLength(500)]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue('');
      }
      ctrl.updateValueAndValidity();
    });

    // Começa com uma linha de espécie já adicionada
    this.adicionarEspecie();
  }

  private configurarUsuario(): void {
    this.auth.currentUser$.subscribe((user) => {
      const admin = user?.role === 'ROLE_ADMIN';
      this.isAdmin.set(admin);

      const ctrl = this.form.get('colaboradorId')!;
      if (admin) {
        ctrl.setValidators([Validators.required]);
        ctrl.updateValueAndValidity({ emitEvent: false });

        this.svc.listarColaboradores().subscribe({
          next: (res: any) => {
            const lista = res?.content ?? res ?? [];
            this.colaboradores.set(lista.filter((c: any) => c.ativo !== false));
          }
        });
      } else {
        const cid = user?.colaboradorId?.trim() ?? '';
        ctrl.clearValidators();
        ctrl.setValue(cid, { emitEvent: false });
        ctrl.updateValueAndValidity({ emitEvent: false });
      }
    });
  }

  // ── Dropdowns ─────────────────────────────────────────────────────────────
  private carregarDropdowns(): void {
    this.svc.listarAreasAtivas().subscribe({
      next: (res: any) => {
        const lista = res?.content ?? res ?? [];
        this.areas.set(lista.filter((a: any) => a.ativo !== false));
      },
    });

    this.svc.listarEspeciesAtivas().subscribe({
      next: (res: any) => {
        const lista = res?.content ?? res ?? [];
        this.especies.set(lista.filter((e: any) => e.ativo !== false));
      },
    });
  }

  // ── FormArray helpers ──────────────────────────────────────────────────────
  novaEspecieGroup(): FormGroup {
    return this.fb.group({
      especieId:   ['', Validators.required],
      quantidade:  [null, [Validators.required, Validators.min(1)]],
      dapMedio:    [null, [Validators.required, Validators.min(0.1), Validators.max(500)]],
      alturaMedia: [null, [Validators.required, Validators.min(0.1), Validators.max(100)]],
    });
  }

  adicionarEspecie(): void {
    this.especiesArray.push(this.novaEspecieGroup());
  }

  removerEspecie(index: number): void {
    if (this.especiesArray.length > 1) {
      this.especiesArray.removeAt(index);
    }
  }

  // Validador customizado: ao menos 1 espécie
  private minOneEspecie(control: AbstractControl): { [key: string]: any } | null {
    const arr = control as FormArray;
    return arr && arr.length > 0 ? null : { minOneEspecie: true };
  }

  // ── Submissão ──────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const raw = this.form.getRawValue();

    // Formata data para YYYY-MM-DD
    const date: Date = raw.dataVistoria;
    const dataVistoria = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

    const payload = {
      numeroParcela:   raw.numeroParcela,
      areaFlorestalId: raw.areaFlorestalId,
      dataVistoria,
      estadoGeral:     raw.estadoGeral,
      presencaPragas:  raw.presencaPragas,
      descricaoPragas: raw.presencaPragas ? (raw.descricaoPragas || null) : null,
      colaboradorId:   this.isAdmin() ? (raw.colaboradorId || null) : undefined,
      especies:        raw.especies,
    };

    this.svc.criar(payload).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.dialog.open(ProtocoloDialogComponent, {
          data: { numeroParcela: res.numeroParcela, id: res.id },
          width: '420px',
          maxWidth: 'calc(100vw - 1rem)',
          panelClass: ['responsive-dialog-panel', 'responsive-dialog-panel--narrow'],
          disableClose: true,
        });
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  cancelar(): void {
    this.router.navigate(['/inventario']);
  }

  // ── Label helpers ──────────────────────────────────────────────────────────
  nomeEspecie(id: string): string {
    const e = this.especies().find(x => x.id === id);
    return e ? `${e.nomePopular} (${e.nomeCientifico})` : '';
  }
}
