import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { TaskRunDetailComponent } from './components/task-run-detail/task-run-detail.component';
import { TaskRunListComponent } from './components/task-run-list/task-run-list.component';
import { TaskRunsService } from './services/task-runs.service';
import { TaskRunsRoutingModule } from './task-runs-routing.module';

@NgModule({
  declarations: [TaskRunListComponent, TaskRunDetailComponent],
  imports: [SharedModule, TaskRunsRoutingModule],
  providers: [TaskRunsService],
})
export class TaskRunsModule {}
