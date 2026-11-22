import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { numericIdGuard } from '../../core/guards/numeric-id.guard';
import { TaskRunDetailComponent } from './components/task-run-detail/task-run-detail.component';
import { TaskRunListComponent } from './components/task-run-list/task-run-list.component';

const routes: Routes = [
  { path: '', title: 'Task Runs', component: TaskRunListComponent },
  {
    path: ':id',
    title: 'Task Run',
    component: TaskRunDetailComponent,
    canActivate: [numericIdGuard],
    data: { breadcrumb: 'Details', invalidIdRedirect: '/task-runs' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TaskRunsRoutingModule {}
