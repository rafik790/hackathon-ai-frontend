export interface AppEnvironment {
  readonly production: boolean;
  readonly appVersion: string;
  /** Base of the REST API, relative to the document base href unless absolute. */
  readonly apiBaseUrl: string;
  /** Base of Spring Boot Actuator endpoints, relative to the document base href unless absolute. */
  readonly actuatorBaseUrl: string;
  /** Swagger UI location. */
  readonly apiDocsUrl: string;
  /** Default auto-refresh interval in milliseconds. */
  readonly autoRefreshIntervalMs: number;
}
