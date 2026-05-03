import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, MatButtonModule, MatIconModule],
  template: `
    <div class="not-found-container">
      <mat-icon class="not-found-icon">forest</mat-icon>
      <h1>404</h1>
      <h2>Página não encontrada</h2>
      <p>O caminho que você tentou acessar não existe neste sistema.</p>
      <a mat-raised-button color="primary" routerLink="/login">
        <mat-icon>home</mat-icon>
        Voltar ao início
      </a>
    </div>
  `,
  styles: [`
    .not-found-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
      text-align: center;
      color: var(--gf-text);
    }
    .not-found-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: var(--gf-primary);
    }
    h1 { font-size: 5rem; margin: 0; color: var(--gf-primary-dark); }
    h2 { font-size: 1.5rem; margin: 0; }
    p  { color: var(--gf-text-secondary); }
  `]
})
export class NotFoundComponent {}
