import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-access-denied',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="denied-container">
      <mat-icon class="denied-icon">lock</mat-icon>
      <h1>Acesso Negado</h1>
      <p>Você não tem permissão para acessar esta página.</p>
      <a mat-raised-button color="primary" routerLink="/dashboard">
        <mat-icon>arrow_back</mat-icon>
        Voltar ao Dashboard
      </a>
    </div>
  `,
  styles: [`
    .denied-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
      text-align: center;
    }
    .denied-icon {
      font-size: 72px;
      width: 72px;
      height: 72px;
      color: #c62828;
    }
    h1 { font-size: 2rem; margin: 0; color: #c62828; }
    p  { color: var(--gf-text-secondary); }
  `]
})
export class AccessDeniedComponent {}
