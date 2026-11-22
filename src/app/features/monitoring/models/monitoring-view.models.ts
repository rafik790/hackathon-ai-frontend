export interface HealthDimension {
  readonly id: 'application' | 'kubernetes' | 'collector' | 'pipelines';
  readonly title: string;
  readonly icon: string;
  /** Status key understood by app-status-badge, or null when only figures are shown. */
  readonly status: string | null;
  readonly statusLabel: string | null;
  readonly headline: string;
  readonly detail: string;
  readonly source: string;
  readonly link: string | null;
}

export interface HealthComponentRow {
  readonly name: string;
  readonly status: string;
  readonly details: readonly { readonly key: string; readonly value: string }[];
}
