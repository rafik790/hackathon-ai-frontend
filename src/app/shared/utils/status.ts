/** Visual tone of a status, matching the status colours of the design system. */
export type StatusTone = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

interface StatusPresentation {
  readonly label: string;
  readonly tone: StatusTone;
  readonly icon: string;
}

/**
 * Presentation of every status the UI may render: the backend execution statuses
 * (RUNNING, SUCCEEDED, FAILED, UNKNOWN), failure analysis and Actuator health statuses and Tekton
 * states the backend may expose in future (CANCELLED).
 */
const PRESENTATION: Readonly<Record<string, StatusPresentation>> = {
  SUCCEEDED: { label: 'Succeeded', tone: 'success', icon: 'check_circle' },
  FAILED: { label: 'Failed', tone: 'danger', icon: 'cancel' },
  RUNNING: { label: 'Running', tone: 'info', icon: 'sync' },
  UNKNOWN: { label: 'Unknown', tone: 'neutral', icon: 'help' },
  PENDING: { label: 'Pending', tone: 'neutral', icon: 'schedule' },
  PROCESSING: { label: 'Processing', tone: 'info', icon: 'sync' },
  RETRY_PENDING: { label: 'Retry pending', tone: 'warning', icon: 'schedule' },
  COMPLETED: { label: 'Completed', tone: 'success', icon: 'check_circle' },
  CANCELLED: { label: 'Cancelled', tone: 'warning', icon: 'block' },
  UP: { label: 'Up', tone: 'success', icon: 'check_circle' },
  DOWN: { label: 'Down', tone: 'danger', icon: 'error' },
  OUT_OF_SERVICE: { label: 'Out of service', tone: 'danger', icon: 'error' },
  DEGRADED: { label: 'Degraded', tone: 'warning', icon: 'warning' },
  HEALTHY: { label: 'Healthy', tone: 'success', icon: 'check_circle' },
  DISABLED: { label: 'Disabled', tone: 'neutral', icon: 'pause_circle' },
  NO_DATA: { label: 'No data yet', tone: 'neutral', icon: 'hourglass_empty' },
  UNREACHABLE: { label: 'Unreachable', tone: 'danger', icon: 'cloud_off' },
};

export function statusPresentation(status: string | null | undefined): StatusPresentation {
  const key = (status ?? 'UNKNOWN').toUpperCase();
  return PRESENTATION[key] ?? { label: humanize(key), tone: 'neutral', icon: 'help' };
}

function humanize(value: string): string {
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
