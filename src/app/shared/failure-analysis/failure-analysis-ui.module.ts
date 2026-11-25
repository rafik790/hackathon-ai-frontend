import { NgModule } from '@angular/core';
import { SharedModule } from '../shared.module';
import { LevelBadgeComponent } from './level-badge.component';

/** Building blocks of failure analyses. Separate from SharedModule to keep them out of the initial bundle. */
@NgModule({
  declarations: [LevelBadgeComponent],
  imports: [SharedModule],
  exports: [LevelBadgeComponent],
})
export class FailureAnalysisUiModule {}
