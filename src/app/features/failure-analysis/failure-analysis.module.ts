import { NgModule } from '@angular/core';
import { ChartsModule } from '../../shared/charts/charts.module';
import { SharedModule } from '../../shared/shared.module';
import { FailureAnalysisComponent } from './components/failure-analysis/failure-analysis.component';
import { FailureAnalysisRoutingModule } from './failure-analysis-routing.module';
import { FailureAnalysisService } from './services/failure-analysis.service';

@NgModule({
  declarations: [FailureAnalysisComponent],
  imports: [SharedModule, ChartsModule, FailureAnalysisRoutingModule],
  providers: [FailureAnalysisService],
})
export class FailureAnalysisModule {}
