import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidatorFn,
  Validators
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { NotificationService } from '../../../core/services/notification.service';
import { ColaboradorService } from '../colaborador.service';
import { Colaborador, ColaboradorFormData } from '../models/Colaborador';

@Component({
  selector: 'app-colaborador-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatSlideToggleModule
  ],
  templateUrl: './colaborador-edit.component.html',
  styleUrl: './colaborador-edit.component.scss'
})
export class ColaboradorEditComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly colaboradorService = inject(ColaboradorService);
  private readonly notificationService = inject(NotificationService);

  readonly funcaoOptions = [
    'ENGENHEIRO FLORESTAL',
    'TECNICO DE CAMPO',
    'ANALISTA AMBIENTAL',
    'SUPERVISOR',
    'OPERADOR DE MAQUINAS',
    'AUXILIAR FLORESTAL'
  ];

  colaborador: Colaborador | null = null;
  colaboradorId: string | null = null;
  isEditMode = false;
  loading = true;
  submitting = false;
  formError: string | null = null;

  readonly form = this.fb.group({
    nome: ['', [Validators.required]],
    cpf: ['', [Validators.required, this.cpfValidator()]],
    matricula: ['', [Validators.required]],
    funcao: ['', [Validators.required]],
    areaAtuacao: ['', [Validators.required]],
    dataAdmissao: ['', [Validators.required]],
    qualificacoes: [''],
    certificacoes: [''],
    contatoEmergenciaNome: ['', [Validators.required]],
    contatoEmergenciaTelefone: ['', [Validators.required]],
    criarAcessoSistema: [false],
    senha: ['']
  });

  ngOnInit(): void {
    this.bindCreateAccessToggle();

    const id = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!id;
    this.colaboradorId = id;

    if (!this.isEditMode) {
      this.loading = false;
      return;
    }

    if (!id) {
      this.loading = false;
      this.notificationService.error('Colaborador invalido.');
      return;
    }

    this.form.get('criarAcessoSistema')?.setValue(false, { emitEvent: false });
    this.form.get('criarAcessoSistema')?.disable({ emitEvent: false });
    this.form.get('senha')?.clearValidators();
    this.form.get('senha')?.updateValueAndValidity({ emitEvent: false });

    this.colaboradorService.buscarPorId(id).subscribe({
      next: (colaborador) => {
        this.colaborador = colaborador;
        this.patchForm(colaborador);
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.notificationService.error('Nao foi possivel carregar o colaborador para edicao.');
      }
    });
  }

  get showPasswordField(): boolean {
    return !this.isEditMode && !!this.form.get('criarAcessoSistema')?.value;
  }

  fieldError(controlName: string): string {
    const control = this.form.get(controlName);
    if (!control || !(control.touched || control.dirty)) return '';
    if (control.hasError('required')) return 'Campo obrigatorio.';
    if (control.hasError('cpf')) return 'CPF invalido.';
    if (control.hasError('minlength')) return 'Informe ao menos 6 caracteres.';
    if (control.hasError('api')) return control.getError('api') as string;
    return '';
  }

  onCpfInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = this.maskCpf(input.value);
    this.form.get('cpf')?.setValue(masked, { emitEvent: false });
  }

  onEmergencyPhoneInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    const masked = this.maskPhone(input.value);
    this.form.get('contatoEmergenciaTelefone')?.setValue(masked, { emitEvent: false });
  }

  salvar(): void {
    this.formError = null;
    this.clearApiErrors();

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const payload = this.buildPayload();
    const request$ = this.isEditMode && this.colaboradorId
      ? this.colaboradorService.atualizar(this.colaboradorId, payload)
      : this.colaboradorService.criar(payload);

    request$.subscribe({
      next: () => {
        this.submitting = false;
        this.notificationService.success(
          this.isEditMode
            ? 'Colaborador atualizado com sucesso.'
            : 'Colaborador cadastrado com sucesso.'
        );
        this.router.navigate(['/colaboradores']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting = false;
        if (!this.applyApiErrors(err)) {
          this.formError = 'Nao foi possivel salvar o colaborador.';
        }
      }
    });
  }

  cancelar(): void {
    if (this.colaborador?.id != null) {
      this.router.navigate(['/colaboradores', this.colaborador.id], { state: { colaborador: this.colaborador } });
      return;
    }

    this.router.navigate(['/colaboradores']);
  }

  private patchForm(colaborador: Colaborador): void {
    this.form.patchValue({
      nome: colaborador.nome,
      cpf: colaborador.cpf,
      matricula: colaborador.matricula,
      funcao: colaborador.funcao,
      areaAtuacao: colaborador.areaAtuacao,
      dataAdmissao: this.toInputDate(colaborador.dataAdmissao),
      qualificacoes: colaborador.qualificacoes,
      certificacoes: colaborador.certificacoes,
      contatoEmergenciaNome: colaborador.contatoEmergenciaNome,
      contatoEmergenciaTelefone: colaborador.contatoEmergenciaTelefone
    });
  }

  private bindCreateAccessToggle(): void {
    const toggleControl = this.form.get('criarAcessoSistema');
    const senhaControl = this.form.get('senha');

    toggleControl?.valueChanges.subscribe((enabled) => {
      if (this.isEditMode) {
        senhaControl?.clearValidators();
        senhaControl?.setValue('', { emitEvent: false });
        senhaControl?.updateValueAndValidity({ emitEvent: false });
        return;
      }

      if (enabled) {
        senhaControl?.setValidators([Validators.required, Validators.minLength(6)]);
      } else {
        senhaControl?.clearValidators();
        senhaControl?.setValue('', { emitEvent: false });
      }

      senhaControl?.updateValueAndValidity({ emitEvent: false });
    });
  }

  private buildPayload(): ColaboradorFormData {
    const raw = this.form.getRawValue();

    return {
      nome: `${raw.nome ?? ''}`.trim(),
      cpf: `${raw.cpf ?? ''}`,
      matricula: `${raw.matricula ?? ''}`.trim(),
      funcao: `${raw.funcao ?? ''}`,
      areaAtuacao: `${raw.areaAtuacao ?? ''}`.trim(),
      dataAdmissao: this.toApiDate(raw.dataAdmissao),
      qualificacoes: `${raw.qualificacoes ?? ''}`.trim(),
      certificacoes: `${raw.certificacoes ?? ''}`.trim(),
      contatoEmergenciaNome: `${raw.contatoEmergenciaNome ?? ''}`.trim(),
      contatoEmergenciaTelefone: `${raw.contatoEmergenciaTelefone ?? ''}`,
      criarAcessoSistema: !this.isEditMode && !!raw.criarAcessoSistema,
      senha: !this.isEditMode && raw.criarAcessoSistema ? `${raw.senha ?? ''}` : undefined
    };
  }

  private toApiDate(value: unknown): string {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().slice(0, 10);
    }

    const text = `${value ?? ''}`.trim();
    if (!text) {
      return '';
    }

    return text.length >= 10 ? text.slice(0, 10) : text;
  }

  private toInputDate(value: string): string {
    return value ? value.slice(0, 10) : '';
  }

  private clearApiErrors(): void {
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);
      if (!control?.errors?.['api']) return;
      const { api, ...remainingErrors } = control.errors;
      control.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    });
  }

  private applyApiErrors(err: HttpErrorResponse): boolean {
    if (![400, 409, 422].includes(err.status) || !err.error || typeof err.error !== 'object') {
      return false;
    }

    const payload = err.error as Record<string, unknown>;
    const fieldErrors = this.extractFieldErrors(payload);
    let hasMappedError = false;

    Object.entries(fieldErrors).forEach(([field, message]) => {
      const control = this.form.get(this.normalizeFieldName(field));
      if (!control) return;
      control.setErrors({ ...(control.errors ?? {}), api: message });
      control.markAsTouched();
      hasMappedError = true;
    });

    if (!hasMappedError && typeof payload['message'] === 'string') {
      this.formError = payload['message'];
    }

    return hasMappedError || !!this.formError;
  }

  private extractFieldErrors(payload: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    for (const key of ['errors', 'fieldErrors', 'violations']) {
      const value = payload[key];
      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (!item || typeof item !== 'object') return;
          const entry = item as Record<string, unknown>;
          const field = this.firstString(entry, ['field', 'campo', 'name', 'property']);
          const message = this.firstString(entry, ['message', 'mensagem', 'defaultMessage']);
          if (field && message) result[field] = message;
        });
      } else if (value && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([field, message]) => {
          if (typeof message === 'string' && message.trim()) result[field] = message.trim();
        });
      }
    }
    return result;
  }

  private firstString(source: Record<string, unknown>, keys: string[]): string | null {
    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) return value.trim();
    }
    return null;
  }

  private normalizeFieldName(field: string): string {
    const aliases: Record<string, string> = {
      area: 'areaAtuacao',
      areaatuacao: 'areaAtuacao',
      funcaoid: 'funcao',
      contatoemergencia: 'contatoEmergenciaNome',
      telefoneemergencia: 'contatoEmergenciaTelefone'
    };

    const normalized = field.replace(/[^a-zA-Z]/g, '').toLowerCase();
    return aliases[normalized] ?? field;
  }

  private cpfValidator(): ValidatorFn {
    return (control: AbstractControl) => {
      const digits = `${control.value ?? ''}`.replace(/\D/g, '');
      if (!digits) return null;
      if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return { cpf: true };

      let sum = 0;
      for (let index = 0; index < 9; index += 1) {
        sum += Number(digits[index]) * (10 - index);
      }

      let remainder = (sum * 10) % 11;
      if (remainder === 10) remainder = 0;
      if (remainder !== Number(digits[9])) return { cpf: true };

      sum = 0;
      for (let index = 0; index < 10; index += 1) {
        sum += Number(digits[index]) * (11 - index);
      }

      remainder = (sum * 10) % 11;
      if (remainder === 10) remainder = 0;

      return remainder === Number(digits[10]) ? null : { cpf: true };
    };
  }

  private maskCpf(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
      .replace(/^(\d{3})(\d)/, '$1.$2')
      .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1-$2');
  }

  private maskPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 10) {
      return digits
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2');
    }

    return digits
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
}
