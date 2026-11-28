import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { ReliabilityAgentComponent } from './components/reliability-agent/reliability-agent.component';
import { ReliabilityAgentRoutingModule } from './reliability-agent-routing.module';

/** Reliability Agent page: questions to the interactive reliability agent. Lazy loaded. */
@NgModule({
  declarations: [ReliabilityAgentComponent],
  imports: [SharedModule, ReliabilityAgentRoutingModule],
})
export class ReliabilityAgentModule {}
