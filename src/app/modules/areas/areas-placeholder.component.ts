import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-areas-placeholder',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <div style="padding:2rem;text-align:center;color:var(--gf-text-secondary)">
      
      <h2>Módulo Areas</h2>
      <p>Em construção — será implementado nas próximas tasks.</p>
    </div>
  `
})
export class AreasPlaceholderComponent { }
