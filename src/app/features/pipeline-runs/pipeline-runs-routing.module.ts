import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { numericIdGuard } from '../../core/guards/numeric-id.guard';
import { PipelineRunDetailComponent } from './components/pipeline-run-detail/pipeline-run-detail.component';
import { PipelineRunListComponent } from './components/pipeline-run-list/pipeline-run-list.component';

const routes: Routes = [
  { path: '', title: 'Pipeline Runs', component: PipelineRunListComponent },
  {
    path: ':id',
    title: 'Pipeline Run',
    component: PipelineRunDetailComponent,
    canActivate: [numericIdGuard],
    data: { breadcrumb: 'Details', invalidIdRedirect: '/pipeline-runs' },
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class PipelineRunsRoutingModule {}
