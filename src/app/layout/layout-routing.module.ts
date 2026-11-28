import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ShellComponent } from './components/shell/shell.component';

/** Every feature renders inside the shell and is lazy loaded. */
const routes: Routes = [
  {
    path: '',
    component: ShellComponent,
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'overview' },
      {
        path: 'overview',
        data: { breadcrumb: 'Overview' },
        loadChildren: () => import('../features/dashboard/dashboard.module').then((m) => m.DashboardModule),
      },
      {
        path: 'pipeline-runs',
        data: { breadcrumb: 'Pipeline Runs' },
        loadChildren: () => import('../features/pipeline-runs/pipeline-runs.module').then((m) => m.PipelineRunsModule),
      },
      {
        path: 'task-runs',
        data: { breadcrumb: 'Task Runs' },
        loadChildren: () => import('../features/task-runs/task-runs.module').then((m) => m.TaskRunsModule),
      },
      {
        path: 'monitoring',
        data: { breadcrumb: 'Monitoring' },
        loadChildren: () => import('../features/monitoring/monitoring.module').then((m) => m.MonitoringModule),
      },
      {
        path: 'failure-analysis',
        data: { breadcrumb: 'Failure Analysis' },
        loadChildren: () =>
          import('../features/failure-analysis/failure-analysis.module').then((m) => m.FailureAnalysisModule),
      },
      {
        path: 'failure-patterns',
        data: { breadcrumb: 'Failure Patterns' },
        loadChildren: () =>
          import('../features/failure-patterns/failure-patterns.module').then((m) => m.FailurePatternsModule),
      },
      {
        path: 'reliability-agent',
        data: { breadcrumb: 'Reliability Agent' },
        loadChildren: () =>
          import('../features/reliability-agent/reliability-agent.module').then((m) => m.ReliabilityAgentModule),
      },
      {
        path: 'settings',
        data: { breadcrumb: 'Settings' },
        loadChildren: () => import('../features/settings/settings.module').then((m) => m.SettingsModule),
      },
      { path: '**', title: 'Not found', data: { breadcrumb: 'Not found' }, component: NotFoundComponent },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LayoutRoutingModule {}
