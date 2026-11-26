import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { applyChartDefaults } from './chart-theme';
import { ExecutionTrendChartComponent } from './execution-trend-chart.component';

const CHARTS = [ExecutionTrendChartComponent];

/**
 * Chart.js based components. Kept out of SharedModule so Chart.js is only downloaded by the lazy
 * feature module that draws charts (Overview).
 */
@NgModule({
  declarations: CHARTS,
  imports: [CommonModule, NgChartsModule],
  exports: CHARTS,
})
export class ChartsModule {
  constructor() {
    applyChartDefaults();
  }
}
