import { NgModule } from '@angular/core';
import { ChartsModule } from '../../shared/charts/charts.module';
import { SharedModule } from '../../shared/shared.module';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { RecentPipelineRunsComponent } from './components/recent-pipeline-runs/recent-pipeline-runs.component';
import { RecentTaskRunsComponent } from './components/recent-task-runs/recent-task-runs.component';
import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardService } from './services/dashboard.service';

@NgModule({
  declarations: [DashboardComponent, RecentPipelineRunsComponent, RecentTaskRunsComponent],
  imports: [SharedModule, ChartsModule, DashboardRoutingModule],
  providers: [DashboardService],
})
export class DashboardModule {}
