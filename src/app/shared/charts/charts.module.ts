import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgChartsModule } from 'ng2-charts';
import { BarListChartComponent } from './bar-list-chart.component';
import { applyChartDefaults } from './chart-theme';
import { DoughnutChartComponent } from './doughnut-chart.component';
import { ExecutionTrendChartComponent } from './execution-trend-chart.component';
import { FailureTrendChartComponent } from './failure-trend-chart.component';

const CHARTS = [BarListChartComponent, DoughnutChartComponent, ExecutionTrendChartComponent, FailureTrendChartComponent];

/**
 * Chart.js based components. Kept out of SharedModule so Chart.js is only downloaded by the lazy
 * feature modules that draw charts (Overview, Failure Analysis).
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
