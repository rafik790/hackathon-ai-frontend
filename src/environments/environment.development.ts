import { AppEnvironment } from './environment.model';

/** Local development: `ng serve` proxies `/agent/api` and `/agent/actuator` to localhost:8080 (proxy.conf.json). */
export const environment: AppEnvironment = {
  production: false,
  appVersion: '1.0.0-dev',
  apiBaseUrl: 'http://localhost:8080/api/v1',
  actuatorBaseUrl: 'http://localhost:8080/actuator',
  apiDocsUrl: 'http://localhost:8080/swagger-ui.html',
  autoRefreshIntervalMs: 30000,
};
