import { Injectable, inject } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private snackBar = inject(MatSnackBar);

  private base: MatSnackBarConfig = {
    duration: 4000,
    horizontalPosition: 'end',
    verticalPosition: 'top',
  };

  success(message: string): void {
    this.openAsync(message, {
      ...this.base,
      panelClass: ['snack-success'],
    });
  }

  error(message: string): void {
    this.openAsync(message, {
      ...this.base,
      duration: 6000,
      panelClass: ['snack-error'],
    });
  }

  warning(message: string): void {
    this.openAsync(message, {
      ...this.base,
      panelClass: ['snack-warning'],
    });
  }

  info(message: string): void {
    this.openAsync(message, {
      ...this.base,
      panelClass: ['snack-info'],
    });
  }

  private openAsync(message: string, config: MatSnackBarConfig): void {
    setTimeout(() => {
      this.snackBar.open(message, 'Fechar', config);
    });
  }
}
