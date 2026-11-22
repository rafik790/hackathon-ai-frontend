import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private readonly snackBar: MatSnackBar) {}

  info(message: string): void {
    this.snackBar.open(message, undefined, { duration: 2500, horizontalPosition: 'end', verticalPosition: 'bottom' });
  }

  error(message: string): void {
    this.snackBar.open(message, 'Dismiss', {
      duration: 6000,
      panelClass: 'snack-error',
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
    });
  }
}
