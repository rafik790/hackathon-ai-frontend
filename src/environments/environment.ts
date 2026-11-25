import { AppEnvironment } from './environment.model';

/**
 * Production configuration.
 *
 * The SPA is served from the root (`<base href="/">`); backend URLs point at the
 * backend under its own `/agent` prefix.
 */
export const environment: AppEnvironment = {
  production: true,
  appVersion: '1.0.0',
  apiBaseUrl: 'http://localhost:8080/agent/api/v1',
  actuatorBaseUrl: 'http://localhost:8080/agent/actuator',
  apiDocsUrl: 'http://localhost:8080/agent/swagger-ui.html',
  autoRefreshIntervalMs: 30000,
};
