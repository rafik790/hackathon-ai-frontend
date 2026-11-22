import { AppEnvironment } from './environment.model';

/** Local development: `ng serve` proxies `/agent/api` and `/agent/actuator` to localhost:8080 (proxy.conf.json). */
export const environment: AppEnvironment = {
  production: false,
  appVersion: '1.0.0-dev',
  apiBaseUrl: 'http://65.0.96.142/agent/api/v1',
  actuatorBaseUrl: 'http://65.0.96.142/agent/actuator',
  apiDocsUrl: 'http://65.0.96.142/agent/swagger-ui.html',
  autoRefreshIntervalMs: 30000,
};
