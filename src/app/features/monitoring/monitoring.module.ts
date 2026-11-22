import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { HealthCardComponent } from './components/health-card/health-card.component';
import { MonitoringComponent } from './components/monitoring/monitoring.component';
import { MonitoringRoutingModule } from './monitoring-routing.module';
import { MonitoringService } from './services/monitoring.service';

@NgModule({
  declarations: [MonitoringComponent, HealthCardComponent],
  imports: [SharedModule, MonitoringRoutingModule],
  providers: [MonitoringService],
})
export class MonitoringModule {}
