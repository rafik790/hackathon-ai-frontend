import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, Optional } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import { filter, take } from 'rxjs';
import { ApiError } from '../../core/models/api-error.model';
import { ResolutionHistoryEntry, ResolutionStatus, TaskRunResolutionItem } from '../../core/models/resolution.models';
import { NotificationService } from '../../core/services/notification.service';
import { editResolution } from './resolution-editor';
import { resolutionLabel, resolvedPercent, statusActions, teamPresentation } from './resolution-presentation';
import { ResolutionStore, ResolutionTarget } from './resolution.store';

/**
 * Resolution of a failed run. For a TaskRun: its status, owner, notes and history, with an action per allowed
 * transition; it needs no AI investigation. For a PipelineRun: a read-only summary derived from its failed TaskRuns,
 * linking to each TaskRun's resolution. Needs a {@link ResolutionStore} from the page.
 */
@Component({
  selector: 'app-resolution-panel',
  standalone: false,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './resolution-panel.component.html',
  styleUrls: ['./resolution-panel.component.scss'],
})
export class ResolutionPanelComponent implements OnChanges {
  @Input({ required: true }) target!: ResolutionTarget;

  readonly state$ = this.store.state$;
  readonly label = resolutionLabel;
  readonly team = teamPresentation;
  readonly percent = resolvedPercent;
  readonly actions = statusActions;

  constructor(
    private readonly store: ResolutionStore,
    private readonly dialog: MatDialog,
    notifications: NotificationService,
    element: ElementRef<HTMLElement>,
    @Optional() route: ActivatedRoute | null,
  ) {
    this.store.saved$
      .pipe(takeUntilDestroyed())
      .subscribe((saved) => notifications.info(`Resolution set to ${resolutionLabel(saved.status)}`));
    // Links such as /task-runs/52#resolution open this section; it renders after the page data, so it scrolls itself.
    if (route?.snapshot.fragment === 'resolution') {
      this.store.state$
        .pipe(filter((state) => state.resolution !== null), take(1), takeUntilDestroyed())
        .subscribe(() => setTimeout(() => element.nativeElement.scrollIntoView({ block: 'start' })));
    }
  }

  get isPipelineRun(): boolean {
    return this.target.kind === 'PIPELINE_RUN';
  }

  ngOnChanges(): void {
    this.store.setTarget(this.target);
  }

  /** Opens the dialog for a change to {@code status}, or for the details only. */
  edit(status?: ResolutionStatus): void {
    editResolution(this.dialog, this.store, status ? { prefill: { status } } : {});
  }

  reload(): void {
    this.store.reload();
  }

  saveErrorTitle(error: ApiError): string {
    return error.status === 409 ? 'The change was not saved; the current resolution is shown again.' : 'The change was not saved.';
  }

  /** Counts per status of the unresolved TaskRuns, most pressing first. */
  unresolvedCounts(byStatus: Readonly<Partial<Record<ResolutionStatus, number>>>): { status: ResolutionStatus; count: number }[] {
    return (['REOPENED', 'FIX_IN_PROGRESS', 'INVESTIGATING', 'OPEN'] as const)
      .filter((status) => (byStatus[status] ?? 0) > 0)
      .map((status) => ({ status, count: byStatus[status]! }));
  }

  trackEntry(_: number, entry: ResolutionHistoryEntry): number {
    return entry.id;
  }

  trackItem(index: number, item: TaskRunResolutionItem): number | string {
    return item.taskRunId ?? `${item.taskRunName}-${index}`;
  }
}
