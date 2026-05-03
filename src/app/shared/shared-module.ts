import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

// Angular Material – componentes usados em todo o app
import { MatButtonModule }          from '@angular/material/button';
import { MatCardModule }            from '@angular/material/card';
import { MatFormFieldModule }       from '@angular/material/form-field';
import { MatInputModule }           from '@angular/material/input';
import { MatIconModule }            from '@angular/material/icon';
import { MatToolbarModule }         from '@angular/material/toolbar';
import { MatSidenavModule }         from '@angular/material/sidenav';
import { MatListModule }            from '@angular/material/list';
import { MatTableModule }           from '@angular/material/table';
import { MatPaginatorModule }       from '@angular/material/paginator';
import { MatSortModule }            from '@angular/material/sort';
import { MatSelectModule }          from '@angular/material/select';
import { MatDatepickerModule }      from '@angular/material/datepicker';
import { MatNativeDateModule }      from '@angular/material/core';
import { MatSnackBarModule }        from '@angular/material/snack-bar';
import { MatDialogModule }          from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule }     from '@angular/material/progress-bar';
import { MatChipsModule }           from '@angular/material/chips';
import { MatTooltipModule }         from '@angular/material/tooltip';
import { MatMenuModule }            from '@angular/material/menu';
import { MatBadgeModule }           from '@angular/material/badge';
import { MatDividerModule }         from '@angular/material/divider';

const MATERIAL_MODULES = [
  MatButtonModule, MatCardModule, MatFormFieldModule, MatInputModule,
  MatIconModule, MatToolbarModule, MatSidenavModule, MatListModule,
  MatTableModule, MatPaginatorModule, MatSortModule, MatSelectModule,
  MatDatepickerModule, MatNativeDateModule, MatSnackBarModule,
  MatDialogModule, MatProgressSpinnerModule, MatChipsModule,
  MatTooltipModule, MatMenuModule, MatBadgeModule, MatDividerModule,
  MatProgressBarModule,
];

/**
 * SharedModule – importado em todos os feature modules.
 * Exporta Angular Material, Forms e componentes/pipes reutilizáveis.
 */
@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ...MATERIAL_MODULES,
  ],
  exports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    ...MATERIAL_MODULES,
  ]
})
export class SharedModule {}
