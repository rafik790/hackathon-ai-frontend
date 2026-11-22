import { NgModule } from '@angular/core';
import { RouterModule, Routes, TitleStrategy } from '@angular/router';
import { PageTitleStrategy } from './core/services/page-title.strategy';

/**
 * Root router. Application routes are defined by LayoutRoutingModule (shell + lazy features).
 * PathLocationStrategy is used with <base href="/">; Nginx falls back to index.html so deep
 * links and browser refreshes work.
 */
const routes: Routes = [];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' }),
  ],
  exports: [RouterModule],
  providers: [{ provide: TitleStrategy, useClass: PageTitleStrategy }],
})
export class AppRoutingModule {}
