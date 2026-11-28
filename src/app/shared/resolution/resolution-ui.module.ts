import { NgModule } from '@angular/core';
import { SharedModule } from '../shared.module';
import { ResolutionPanelComponent } from './resolution-panel.component';
import { ResolutionSuggestionComponent } from './resolution-suggestion.component';
import { ResolutionUpdateDialogComponent } from './resolution-update-dialog.component';

/**
 * Resolution tracking of failed runs, used by the TaskRun and PipelineRun pages. Separate from SharedModule to keep it
 * out of the initial bundle.
 */
@NgModule({
  declarations: [ResolutionPanelComponent, ResolutionSuggestionComponent, ResolutionUpdateDialogComponent],
  imports: [SharedModule],
  exports: [ResolutionPanelComponent, ResolutionSuggestionComponent],
})
export class ResolutionUiModule {}
