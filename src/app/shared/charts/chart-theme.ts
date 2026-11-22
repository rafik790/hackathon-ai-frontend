import { Chart, ChartOptions } from 'chart.js';

/** Literal colours for Chart.js, mirroring src/styles/_tokens.scss. */
export const CHART_COLORS = {
  success: '#16a34a',
  danger: '#dc2626',
  warning: '#d97706',
  info: '#2563eb',
  neutral: '#94a3b8',
  primary: '#2563eb',
  primarySoft: 'rgba(37, 99, 235, 0.12)',
  dangerSoft: 'rgba(220, 38, 38, 0.10)',
  grid: '#eef1f5',
  axis: '#697586',
  text: '#364152',
  tooltipBg: '#0f172a',
} as const;

export const STATUS_CHART_COLORS = {
  SUCCEEDED: CHART_COLORS.success,
  FAILED: CHART_COLORS.danger,
  RUNNING: CHART_COLORS.info,
  UNKNOWN: CHART_COLORS.neutral,
} as const;

/** Chart hosts must be sized blocks: Chart.js fills its parent when maintainAspectRatio is false. */
export const CHART_HOST_STYLES = ':host { display: block; position: relative; height: 100%; width: 100%; }';

export const CHART_FONT_FAMILY = "Inter, 'Segoe UI', -apple-system, BlinkMacSystemFont, Roboto, Arial, sans-serif";

/** Applies global Chart.js defaults once at startup (called from AppModule). */
export function applyChartDefaults(): void {
  const d = Chart.defaults;
  d.font.family = CHART_FONT_FAMILY;
  d.font.size = 12;
  d.color = CHART_COLORS.axis;
  d.maintainAspectRatio = false;
  d.responsive = true;
  d.animation = { ...d.animation, duration: 250 };
  d.plugins.legend.position = 'bottom';
  Object.assign(d.plugins.legend.labels, {
    usePointStyle: true,
    pointStyle: 'circle',
    boxWidth: 8,
    boxHeight: 8,
    padding: 16,
    color: CHART_COLORS.text,
  });
  Object.assign(d.plugins.tooltip, {
    backgroundColor: CHART_COLORS.tooltipBg,
    titleColor: '#ffffff',
    bodyColor: '#e2e8f0',
    padding: 10,
    cornerRadius: 6,
    boxPadding: 4,
    usePointStyle: true,
  });
}

/** Common options of time-bucketed bar/line charts. */
export function timeSeriesOptions(yTitle: string, stacked: boolean): ChartOptions<'bar'> {
  return {
    interaction: { mode: 'index', intersect: false },
    scales: {
      x: {
        stacked,
        grid: { display: false },
        border: { color: CHART_COLORS.grid },
        ticks: { maxRotation: 0, autoSkipPadding: 16, color: CHART_COLORS.axis },
      },
      y: {
        stacked,
        beginAtZero: true,
        grid: { color: CHART_COLORS.grid },
        border: { display: false },
        ticks: { precision: 0, color: CHART_COLORS.axis },
        title: { display: true, text: yTitle, color: CHART_COLORS.axis, font: { size: 11 } },
      },
    },
  };
}

/** Formats a UTC bucket start for an axis label in the viewer's local time. */
export function formatBucketLabel(iso: string, granularity: 'HOUR' | 'DAY'): string {
  const date = new Date(iso);
  if (granularity === 'HOUR') {
    return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
