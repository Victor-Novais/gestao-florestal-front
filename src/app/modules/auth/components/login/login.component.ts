import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { take } from 'rxjs/operators';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  loading = signal(false);
  hidePassword = signal(true);
  loginError = signal<string | null>(null);

  form = this.fb.group({
    usuario: ['', [Validators.required]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  get usuarioCtrl() { return this.form.get('usuario')!; }
  get senhaCtrl() { return this.form.get('senha')!; }

  usuarioError(): string {
    if (this.usuarioCtrl.hasError('required')) return 'Usuário é obrigatório';
    return '';
  }

  senhaError(): string {
    if (this.senhaCtrl.hasError('required')) return 'Senha é obrigatória';
    if (this.senhaCtrl.hasError('minlength')) return 'Mínimo de 6 caracteres';
    return '';
  }

  onSubmit(): void {
    this.loginError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.loginError.set('Preencha usuário e senha corretamente antes de continuar.');
      return;
    }

    this.loading.set(true);

    const usuario = this.form.getRawValue().usuario ?? '';
    const senha = this.form.getRawValue().senha ?? '';

    this.auth.login({ usuario, senha }).subscribe({
      next: () => {
        this.loading.set(false);
        this.auth.currentUser$.pipe(take(1)).subscribe((user) => {
          if (user?.role === 'ROLE_COLABORADOR') {
            this.router.navigate(['/plantio']);
            return;
          }
          this.router.navigate(['/dashboard']);
        });
      },
      error: (err: unknown) => {
        this.loading.set(false);

        const httpErr = err instanceof HttpErrorResponse ? err : null;

        console.error('Erro no login', {
          raw: err,
          status: httpErr?.status,
          url: httpErr?.url,
          error: httpErr?.error
        });

        if (httpErr?.status === 401) {
          this.loginError.set('Credenciais inválidas. Verifique e-mail e senha.');
        } else if (httpErr?.status === 403) {
          this.loginError.set('Sua conta está inativa. Contate o administrador.');
        } else if (err instanceof Error) {
          this.loginError.set(err.message);
        } else {
          this.loginError.set('Erro ao realizar login. Tente novamente.');
        }
      }
    });
  }
}
