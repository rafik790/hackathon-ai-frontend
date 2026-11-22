import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FailureAnalysisComponent } from './components/failure-analysis/failure-analysis.component';

const routes: Routes = [{ path: '', title: 'Failure Analysis', component: FailureAnalysisComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FailureAnalysisRoutingModule {}
