import { NgModule } from '@angular/core';
import { ChartsModule } from '../../shared/charts/charts.module';
import { FailureAnalysisUiModule } from '../../shared/failure-analysis/failure-analysis-ui.module';
import { SharedModule } from '../../shared/shared.module';
import { FailureAnalysisComponent } from './components/failure-analysis/failure-analysis.component';
import { RecentAnalysesComponent } from './components/recent-analyses/recent-analyses.component';
import { FailureAnalysisRoutingModule } from './failure-analysis-routing.module';
import { FailureAnalysisService } from './services/failure-analysis.service';

@NgModule({
  declarations: [FailureAnalysisComponent, RecentAnalysesComponent],
  imports: [SharedModule, FailureAnalysisUiModule, ChartsModule, FailureAnalysisRoutingModule],
  providers: [FailureAnalysisService],
})
export class FailureAnalysisModule {}
