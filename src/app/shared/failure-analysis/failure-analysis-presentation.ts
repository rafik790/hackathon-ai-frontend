import { EvidenceSource } from '../../core/models/failure-analysis.models';

export type LevelTone = 'critical' | 'danger' | 'warning' | 'info' | 'neutral';

interface LevelPresentation {
  readonly label: string;
  readonly tone: LevelTone;
  readonly icon: string;
}

const LEVELS: Readonly<Record<string, LevelPresentation>> = {
  CRITICAL: { label: 'Critical', tone: 'critical', icon: 'report' },
  HIGH: { label: 'High', tone: 'danger', icon: 'keyboard_double_arrow_up' },
  MEDIUM: { label: 'Medium', tone: 'warning', icon: 'drag_handle' },
  LOW: { label: 'Low', tone: 'info', icon: 'keyboard_arrow_down' },
};

/** Presentation of a severity or priority. */
export function levelPresentation(level: string | null | undefined): LevelPresentation {
  const key = (level ?? '').toUpperCase();
  return LEVELS[key] ?? { label: key ? humanizeConstant(key) : '—', tone: 'neutral', icon: 'remove' };
}

const CATEGORY_LABELS: Readonly<Record<string, string>> = {
  KUBERNETES_INFRASTRUCTURE: 'Kubernetes infrastructure',
  UNKNOWN: 'Not determined',
};

/** Readable name of a backend failure category, including ones added later. */
export function failureCategoryLabel(category: string | null | undefined): string {
  return category ? CATEGORY_LABELS[category] ?? humanizeConstant(category) : '—';
}

const SOURCES: Readonly<Record<EvidenceSource, { readonly label: string; readonly icon: string }>> = {
  CONTAINER_LOG: { label: 'Container log', icon: 'terminal' },
  CONTAINER_STATUS: { label: 'Container status', icon: 'inventory_2' },
  POD_STATUS: { label: 'Pod status', icon: 'widgets' },
  TASK_RUN: { label: 'TaskRun', icon: 'checklist' },
  PIPELINE_RUN: { label: 'PipelineRun', icon: 'account_tree' },
};

export function evidenceSourcePresentation(source: EvidenceSource): { readonly label: string; readonly icon: string } {
  return SOURCES[source] ?? { label: humanizeConstant(source), icon: 'description' };
}

/** `SOURCE_CHECKOUT` → `Source checkout`. */
function humanizeConstant(value: string): string {
  const text = value.replace(/_/g, ' ').toLowerCase();
  return text.charAt(0).toUpperCase() + text.slice(1);
}
