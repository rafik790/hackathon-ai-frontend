import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { ChartCardComponent } from './components/chart-card/chart-card.component';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { DataTableComponent } from './components/data-table/data-table.component';
import { DateRangeFilterComponent } from './components/date-range-filter/date-range-filter.component';
import { DurationComponent } from './components/duration/duration.component';
import { EmptyStateComponent } from './components/empty-state/empty-state.component';
import { ErrorStateComponent } from './components/error-state/error-state.component';
import { ExecutionTimelineComponent } from './components/execution-timeline/execution-timeline.component';
import { FilterBarComponent } from './components/filter-bar/filter-bar.component';
import { KpiCardComponent } from './components/kpi-card/kpi-card.component';
import { LoadingSkeletonComponent } from './components/loading-skeleton/loading-skeleton.component';
import { PageHeaderComponent } from './components/page-header/page-header.component';
import { PendingFeatureComponent } from './components/pending-feature/pending-feature.component';
import { RefreshButtonComponent } from './components/refresh-button/refresh-button.component';
import { StatusBadgeComponent } from './components/status-badge/status-badge.component';
import { TimeRangeSelectorComponent } from './components/time-range-selector/time-range-selector.component';
import { CopyToClipboardDirective } from './directives/copy-to-clipboard.directive';
import { MaterialModule } from './material/material.module';
import { DurationPipe } from './pipes/duration.pipe';
import { FirstFailedTaskPipe } from './pipes/first-failed-task.pipe';
import { RelativeTimePipe } from './pipes/relative-time.pipe';

const COMPONENTS = [
  BreadcrumbComponent,
  ChartCardComponent,
  ConfirmDialogComponent,
  DataTableComponent,
  DateRangeFilterComponent,
  DurationComponent,
  EmptyStateComponent,
  ErrorStateComponent,
  ExecutionTimelineComponent,
  FilterBarComponent,
  KpiCardComponent,
  LoadingSkeletonComponent,
  PageHeaderComponent,
  PendingFeatureComponent,
  RefreshButtonComponent,
  StatusBadgeComponent,
  TimeRangeSelectorComponent,
];

const DIRECTIVES = [CopyToClipboardDirective];
const PIPES = [DurationPipe, FirstFailedTaskPipe, RelativeTimePipe];

/** Reusable presentational building blocks. Import in every feature module. */
@NgModule({
  declarations: [...COMPONENTS, ...DIRECTIVES, ...PIPES],
  imports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule],
  exports: [CommonModule, ReactiveFormsModule, RouterModule, MaterialModule, ...COMPONENTS, ...DIRECTIVES, ...PIPES],
})
export class SharedModule {}
