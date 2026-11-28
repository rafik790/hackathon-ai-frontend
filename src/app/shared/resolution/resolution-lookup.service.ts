import { Injectable } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { ResolutionSummary, ResolutionTargetKind } from '../../core/models/resolution.models';
import { ResolutionApiService } from '../../core/services/resolution-api.service';
import { TableColumn } from '../components/data-table/data-table.models';

/** A list row with its resolution; null when it could not be read. */
export type WithResolution<T> = T & { readonly resolution: ResolutionSummary | null };

/**
 * Resolution status of the rows of a list, read with one batch request per page (never one per row). Read-only:
 * resolutions are changed on the TaskRun page.
 */
@Injectable({ providedIn: 'root' })
export class ResolutionLookupService {
  constructor(private readonly api: ResolutionApiService) {}

  attach<T extends { readonly id: number }>(kind: ResolutionTargetKind, rows: readonly T[]): Observable<WithResolution<T>[]> {
    if (!rows.length) {
      return of([]);
    }
    return this.api.summaries(kind, rows.map((row) => row.id)).pipe(
      map((summaries) => {
        const byId = new Map(summaries.map((summary) => [summary.runId, summary]));
        return rows.map((row) => ({ ...row, resolution: byId.get(row.id) ?? null }));
      }),
      // The list stays usable without resolutions.
      catchError(() => of(rows.map((row) => ({ ...row, resolution: null })))),
    );
  }
}

/**
 * Read-only resolution column. A failed TaskRun without a record is OPEN (the backend says so); a run that has nothing
 * to resolve shows a dash; an unreadable resolution shows "Unknown".
 */
export function resolutionColumn<T>(header = 'Resolution status'): TableColumn<WithResolution<T>> {
  return {
    key: 'resolution',
    header,
    kind: 'status',
    value: (row) => (row.resolution ? row.resolution.status : 'UNKNOWN'),
    secondary: (row) =>
      row.resolution?.failedTaskRuns ? `${row.resolution.resolvedTaskRuns ?? 0} of ${row.resolution.failedTaskRuns} resolved` : null,
  };
}
