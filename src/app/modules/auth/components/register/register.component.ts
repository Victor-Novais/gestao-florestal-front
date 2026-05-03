import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';

import { RegisterRequest, UserRole } from '../../../../core/models/auth.model';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private notify = inject(NotificationService);

  loading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  error = signal<string | null>(null);
  success = signal<string | null>(null);
  currentUser = toSignal(this.auth.currentUser$, { initialValue: null });
  canAssignAdmin = computed(() => this.currentUser()?.role === 'ROLE_ADMIN');
  readonly roleOptions: Array<{ value: UserRole; label: string }> = [
    { value: 'ROLE_COLABORADOR', label: 'Colaborador' },
    { value: 'ROLE_ADMIN', label: 'Administrador' }
  ];

  form = this.fb.group(
    {
      username: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      role: ['ROLE_COLABORADOR' as UserRole, [Validators.required]]
    },
    { validators: this.passwordsMatch }
  );

  get usernameCtrl() { return this.form.get('username')!; }
  get emailCtrl() { return this.form.get('email')!; }
  get passwordCtrl() { return this.form.get('password')!; }
  get confirmPasswordCtrl() { return this.form.get('confirmPassword')!; }
  get roleCtrl() { return this.form.get('role')!; }

  passwordsMatch(group: AbstractControl): ValidationErrors | null {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { notMatching: true };
  }

  availableRoleOptions(): Array<{ value: UserRole; label: string }> {
    return this.canAssignAdmin()
      ? this.roleOptions
      : this.roleOptions.filter((option) => option.value !== 'ROLE_ADMIN');
  }

  usernameError(): string {
    if (this.usernameCtrl.hasError('required')) return 'Usuario e obrigatorio';
    if (this.usernameCtrl.hasError('api')) return this.usernameCtrl.getError('api') as string;
    return '';
  }

  emailError(): string {
    if (this.emailCtrl.hasError('required')) return 'E-mail e obrigatorio';
    if (this.emailCtrl.hasError('email')) return 'Informe um e-mail valido';
    if (this.emailCtrl.hasError('api')) return this.emailCtrl.getError('api') as string;
    return '';
  }

  passwordError(): string {
    if (this.passwordCtrl.hasError('required')) return 'Senha e obrigatoria';
    if (this.passwordCtrl.hasError('minlength')) return 'Minimo de 6 caracteres';
    if (this.passwordCtrl.hasError('api')) return this.passwordCtrl.getError('api') as string;
    return '';
  }

  confirmPasswordError(): string {
    if (this.confirmPasswordCtrl.hasError('required')) return 'Confirme sua senha';
    if (this.confirmPasswordCtrl.hasError('api')) return this.confirmPasswordCtrl.getError('api') as string;
    if (this.form.hasError('notMatching')) return 'As senhas nao coincidem';
    return '';
  }

  roleError(): string {
    if (this.roleCtrl.hasError('required')) return 'Selecione o tipo de conta';
    if (this.roleCtrl.hasError('api')) return this.roleCtrl.getError('api') as string;
    return '';
  }

  submit(): void {
    this.error.set(null);
    this.success.set(null);
    this.clearApiErrors();

    if (!this.canAssignAdmin() && this.roleCtrl.value !== 'ROLE_COLABORADOR') {
      this.roleCtrl.setValue('ROLE_COLABORADOR');
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.error.set('Preencha os campos obrigatorios corretamente antes de continuar.');
      return;
    }

    this.loading.set(true);

    const { username, email, password, role } = this.form.getRawValue();
    const data: RegisterRequest = {
      username: username ?? '',
      email: email ?? '',
      password: password ?? '',
      role: (this.canAssignAdmin() ? role : 'ROLE_COLABORADOR') ?? 'ROLE_COLABORADOR'
    };

    this.auth.register(data).subscribe({
      next: () => {
        this.success.set('Cadastro realizado com sucesso!');
        this.loading.set(false);
        this.notify.success('Usuario cadastrado com sucesso.');
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        console.error('Erro no cadastro', {
          status: err?.status,
          url: err?.url,
          error: err?.error
        });
        if (!this.applyApiValidationErrors(err)) {
          this.error.set(this.extractErrorMessage(err));
        }
      }
    });
  }

  private clearApiErrors(): void {
    Object.keys(this.form.controls).forEach((controlName) => {
      const control = this.form.get(controlName);
      if (!control?.errors?.['api']) {
        return;
      }

      const { api, ...remainingErrors } = control.errors;
      control.setErrors(Object.keys(remainingErrors).length ? remainingErrors : null);
    });
  }

  private applyApiValidationErrors(err: HttpErrorResponse): boolean {
    if (![400, 403, 422].includes(err.status)) {
      return false;
    }

    const fieldErrors = this.extractFieldErrors(err.error);
    let hasMappedError = false;

    Object.entries(fieldErrors).forEach(([field, message]) => {
      const control = this.form.get(this.normalizeFieldName(field));
      if (!control) {
        return;
      }

      control.setErrors({ ...(control.errors ?? {}), api: message });
      control.markAsTouched();
      hasMappedError = true;
    });

    if (!hasMappedError) {
      this.error.set(this.extractErrorMessage(err));
    }

    return hasMappedError || !!this.error();
  }

  private extractFieldErrors(payload: unknown): Record<string, string> {
    if (!payload || typeof payload !== 'object') {
      return {};
    }

    const source = payload as Record<string, unknown>;
    const containers = ['errors', 'fieldErrors', 'violations'];
    const extracted: Record<string, string> = {};

    for (const key of containers) {
      const value = source[key];

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (!item || typeof item !== 'object') {
            return;
          }

          const entry = item as Record<string, unknown>;
          const field = this.firstString(entry, ['field', 'campo', 'name', 'property']);
          const message = this.firstString(entry, ['message', 'mensagem', 'defaultMessage']);

          if (field && message) {
            extracted[field] = message;
          }
        });
      } else if (value && typeof value === 'object') {
        Object.entries(value as Record<string, unknown>).forEach(([field, message]) => {
          if (typeof message === 'string' && message.trim()) {
            extracted[field] = message.trim();
          }
        });
      }
    }

    return extracted;
  }

  private normalizeFieldName(field: string): string {
    const normalized = field.toLowerCase();
    const aliases: Record<string, string> = {
      login: 'email',
      user: 'username',
      usuario: 'username',
      conta: 'role',
      perfil: 'role'
    };

    return aliases[normalized] ?? normalized;
  }

  private firstString(source: Record<string, unknown> | null | undefined, keys: string[]): string | null {
    if (!source) {
      return null;
    }

    for (const key of keys) {
      const value = source[key];
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return null;
  }

  private extractErrorMessage(err: HttpErrorResponse): string {
    const payload = err.error && typeof err.error === 'object'
      ? err.error as Record<string, unknown>
      : null;

    if (err.status === 403) {
      return this.firstString(payload, ['message', 'error'])
        ?? 'Voce nao tem permissao para cadastrar usuarios com esse tipo de conta.';
    }

    return this.firstString(payload, ['message', 'error'])
      ?? 'Erro ao cadastrar usuario.';
  }
}
