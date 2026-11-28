import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ReliabilityAgentComponent } from './components/reliability-agent/reliability-agent.component';

const routes: Routes = [{ path: '', title: 'Reliability Agent', component: ReliabilityAgentComponent }];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ReliabilityAgentRoutingModule {}
