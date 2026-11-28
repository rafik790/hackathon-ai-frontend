import { MatDialog } from '@angular/material/dialog';
import { ResolutionUpdate } from '../../core/models/resolution.models';
import { ResolutionDialogData, ResolutionUpdateDialogComponent } from './resolution-update-dialog.component';
import { ResolutionStore } from './resolution.store';

/**
 * Opens the update dialog for the resolution the store shows and sends the change once the person saves it. Every
 * change goes through this dialog: suggestions only prefill it.
 */
export function editResolution(dialog: MatDialog, store: ResolutionStore, extra: Omit<ResolutionDialogData, 'resolution'> = {}): void {
  const resolution = store.snapshot.resolution;
  if (!resolution?.status) {
    return;
  }
  store.clearSaveError();
  dialog
    .open<ResolutionUpdateDialogComponent, ResolutionDialogData, ResolutionUpdate>(ResolutionUpdateDialogComponent, {
      data: { resolution, ...extra },
      autoFocus: 'first-tabbable',
      maxWidth: '640px',
    })
    .afterClosed()
    // The version the dialog was opened with, even if the resolution was reloaded meanwhile.
    .subscribe((change) => change && store.update(change, resolution.version));
}
