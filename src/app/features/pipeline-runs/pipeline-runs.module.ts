import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { PipelineRunDetailComponent } from './components/pipeline-run-detail/pipeline-run-detail.component';
import { PipelineRunListComponent } from './components/pipeline-run-list/pipeline-run-list.component';
import { PipelineRunsRoutingModule } from './pipeline-runs-routing.module';
import { PipelineRunsService } from './services/pipeline-runs.service';

@NgModule({
  declarations: [PipelineRunListComponent, PipelineRunDetailComponent],
  imports: [SharedModule, PipelineRunsRoutingModule],
  providers: [PipelineRunsService],
})
export class PipelineRunsModule {}
