import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FailurePatternsComponent } from './components/failure-patterns/failure-patterns.component';

const routes: Routes = [{ path: '', title: 'Failure Patterns', component: FailurePatternsComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FailurePatternsRoutingModule {}
