import { NgModule } from '@angular/core';
import { SharedModule } from '../../shared/shared.module';
import { SettingsComponent } from './components/settings/settings.component';
import { SettingsService } from './services/settings.service';
import { SettingsRoutingModule } from './settings-routing.module';

@NgModule({
  declarations: [SettingsComponent],
  imports: [SharedModule, SettingsRoutingModule],
  providers: [SettingsService],
})
export class SettingsModule {}
