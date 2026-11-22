import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { NotFoundComponent } from './components/not-found/not-found.component';
import { ShellComponent } from './components/shell/shell.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { LayoutRoutingModule } from './layout-routing.module';

@NgModule({
  declarations: [ShellComponent, SidebarComponent, TopbarComponent, NotFoundComponent],
  imports: [SharedModule, LayoutRoutingModule],
})
export class LayoutModule {}
