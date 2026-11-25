import { NgModule } from '@angular/core';
import { FailureAnalysisUiModule } from '../../shared/failure-analysis/failure-analysis-ui.module';
import { SharedModule } from '../../shared/shared.module';
import { FailureAnalysisPanelComponent } from './components/failure-analysis-panel/failure-analysis-panel.component';
import { FailureAnalysisResultComponent } from './components/failure-analysis-result/failure-analysis-result.component';
import { TaskRunDetailComponent } from './components/task-run-detail/task-run-detail.component';
import { TaskRunListComponent } from './components/task-run-list/task-run-list.component';
import { TaskRunsService } from './services/task-runs.service';
import { TaskRunsRoutingModule } from './task-runs-routing.module';

@NgModule({
  declarations: [TaskRunListComponent, TaskRunDetailComponent, FailureAnalysisPanelComponent, FailureAnalysisResultComponent],
  imports: [SharedModule, FailureAnalysisUiModule, TaskRunsRoutingModule],
  providers: [TaskRunsService],
})
export class TaskRunsModule {}
