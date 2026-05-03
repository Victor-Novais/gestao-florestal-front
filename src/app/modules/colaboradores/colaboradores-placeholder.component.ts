import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-colaboradores-placeholder',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div style="padding:2rem;text-align:center;color:var(--gf-text-secondary)">
      <mat-icon style="font-size:48px;width:48px;height:48px">groups</mat-icon>
      <h2>Módulo Colaboradores</h2>
      <p>Em construção - será implementado nas próximas tasks.</p>
    </div>
  `
})
export class ColaboradoresPlaceholderComponent {}
