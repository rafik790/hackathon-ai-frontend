/** Mirrors com.hackathon.agent.dto.CollectorStatusResponse and Spring Boot Actuator payloads. */

export interface CollectorLastCycle {
  readonly startedAt: string;
  readonly finishedAt: string;
  readonly durationMs: number;
  readonly successful: boolean;
  /** Resources discovered per kind, e.g. { PipelineRun: 12, TaskRun: 48 }. */
  readonly discovered: Readonly<Record<string, number>>;
  readonly created: number;
  readonly updated: number;
  readonly unchanged: number;
  readonly skipped: number;
  readonly errors: readonly string[];
}

/** Cycle fields are null until the first collection cycle completes. */
export interface CollectorStatus {
  readonly enabled: boolean;
  readonly namespaces: readonly string[];
  readonly pollingIntervalMs: number;
  readonly totalCycles: number;
  readonly consecutiveFailedCycles: number;
  readonly lastSuccessfulCycleAt: string | null;
  readonly lastCycle: CollectorLastCycle | null;
}

/** Actuator health status. DEGRADED is the backend's custom status for a failing collector. */
export type HealthStatus = 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'DEGRADED' | 'UNKNOWN';

export interface HealthComponent {
  readonly status: HealthStatus;
  readonly details?: Readonly<Record<string, unknown>>;
  readonly components?: Readonly<Record<string, HealthComponent>>;
}

/** GET /actuator/health */
export interface ApplicationHealth extends HealthComponent {
  readonly groups?: readonly string[];
}

/** GET /actuator/info (info.app.* and the java contributor are enabled in the backend). */
export interface ApplicationInfo {
  readonly app?: {
    readonly name?: string;
    readonly description?: string;
    readonly phase?: string | number;
  };
  readonly java?: {
    readonly version?: string;
    readonly vendor?: { readonly name?: string };
    readonly runtime?: { readonly name?: string; readonly version?: string };
    readonly jvm?: { readonly name?: string; readonly version?: string };
  };
}

/** Collector state. UNREACHABLE: the status endpoint itself could not be read. */
export type CollectorHealthState = 'HEALTHY' | 'DEGRADED' | 'DISABLED' | 'NO_DATA' | 'UNREACHABLE';
