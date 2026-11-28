import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { FailurePatternAnalysisComponent } from './components/failure-pattern-analysis/failure-pattern-analysis.component';
import { FailurePatternsComponent } from './components/failure-patterns/failure-patterns.component';
import { FailurePatternsRoutingModule } from './failure-patterns-routing.module';

/** Failure Patterns page: user-triggered AI analysis of recurring failures over a period. Lazy loaded. */
@NgModule({
  declarations: [FailurePatternsComponent, FailurePatternAnalysisComponent],
  imports: [SharedModule, FailurePatternsRoutingModule],
})
export class FailurePatternsModule {}
