import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { TIME_RANGE_PRESETS, TimeRangePreset } from '../../../../core/models/dashboard.models';
import { loadOnTrigger } from '../../../../core/models/load-state';
import { CollectorStatusStore } from '../../../../core/services/collector-status.store';
import { NotificationService } from '../../../../core/services/notification.service';
import { PreferencesService, REFRESH_INTERVAL_OPTIONS } from '../../../../core/services/preferences.service';
import { RefreshService } from '../../../../core/services/refresh.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { formatDuration } from '../../../../shared/utils/duration';
import { ConnectivityResult, SettingsService } from '../../services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent {
  readonly info$ = loadOnTrigger(this.refresh.trigger$, () => this.settings.info());
  readonly collector$ = this.collectorStore.state$;
  readonly endpoints = this.settings.endpoints();
  readonly apiDocsUrl = this.settings.apiDocsUrl;
  readonly frontendVersion = this.settings.frontendVersion;
  readonly ranges = TIME_RANGE_PRESETS;
  readonly intervals = REFRESH_INTERVAL_OPTIONS.map((ms) => ({ ms, label: formatDuration(ms) }));

  readonly form = new FormGroup({
    autoRefresh: new FormControl(this.preferences.snapshot.autoRefresh, { nonNullable: true }),
    refreshIntervalMs: new FormControl(this.preferences.snapshot.refreshIntervalMs, { nonNullable: true }),
    defaultRange: new FormControl<TimeRangePreset>(this.preferences.snapshot.defaultRange, { nonNullable: true }),
  });

  connectivity: ConnectivityResult | null = null;
  testing = false;

  constructor(
    private readonly settings: SettingsService,
    private readonly collectorStore: CollectorStatusStore,
    private readonly preferences: PreferencesService,
    private readonly refresh: RefreshService,
    private readonly dialog: MatDialog,
    private readonly notifications: NotificationService,
    private readonly cdr: ChangeDetectorRef,
  ) {
    this.form.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => this.preferences.update(this.form.getRawValue()));
    // Keep the form in sync when preferences change elsewhere (e.g. the top-bar auto-refresh menu).
    this.preferences.preferences$.pipe(takeUntilDestroyed()).subscribe((prefs) =>
      this.form.setValue(
        { autoRefresh: prefs.autoRefresh, refreshIntervalMs: prefs.refreshIntervalMs, defaultRange: prefs.defaultRange },
        { emitEvent: false },
      ),
    );
  }

  testConnection(): void {
    this.testing = true;
    this.settings.testConnection().subscribe((result) => {
      this.connectivity = result;
      this.testing = false;
      this.cdr.markForCheck();
    });
  }

  resetPreferences(): void {
    const data: ConfirmDialogData = {
      title: 'Reset display preferences?',
      message: 'Auto-refresh, refresh interval, default time range and sidebar state return to their defaults in this browser.',
      confirmLabel: 'Reset',
    };
    this.dialog
      .open<ConfirmDialogComponent, ConfirmDialogData, boolean>(ConfirmDialogComponent, { data, width: '420px', maxWidth: '92vw' })
      .afterClosed()
      .pipe(filter((confirmed): confirmed is true => confirmed === true))
      .subscribe(() => {
        this.preferences.reset();
        this.notifications.info('Preferences reset');
      });
  }

  reload(): void {
    this.refresh.refresh();
  }
}
