# CI/CD Reliability AI Agent — Frontend

Angular 16 web console for the [hackathon-ai-agent](https://github.com/rafik790/hackathon-ai-agent) backend: Tekton
PipelineRun / TaskRun reliability, collector health and failure analysis. It is served from the root path (`/`).

| Repository | Role |
|---|---|
| [hackathon-ai-agent](https://github.com/rafik790/hackathon-ai-agent) | Spring Boot backend: collects Tekton executions, serves the REST API |
| hackathon-ai-frontend (this repo) | Angular UI, served by Nginx at `/` |

## Technology

Angular 16.2 (NgModules only; every component, directive and pipe declares `standalone: false`) · Angular Material /
CDK 16.2 · RxJS 7.8 · SCSS design system · Reactive Forms · Chart.js 4.4 + ng2-charts 5.0 · self-hosted Material
Icons (no CDN needed inside the cluster).

## Features

| Page | Route | What it shows |
|---|---|---|
| Overview | `/overview` | KPI cards, success rate / average / P95 duration, execution trend, success vs failure, failure trend, status distribution, recent pipeline and task runs. Time range (24h/7d/30d) and namespace are in the URL. |
| Pipeline Runs | `/pipeline-runs` | Server-side paged, sorted and filtered list (pipeline name, status, namespace, start date range). Filters live in the query string, so views can be bookmarked and survive refresh. |
| Pipeline Run details | `/pipeline-runs/:id` | Metadata, failure panel naming the first failing task, execution timeline with Gantt bars, task run table. |
| Task Runs | `/task-runs` | Same list capabilities, plus task-name and PipelineRun-name filters. |
| Task Run details | `/task-runs/:id` | Execution, metadata, failure reason and message, link to sibling TaskRuns. |
| Monitoring | `/monitoring` | Four separate dimensions — application health, Kubernetes connectivity, collector health and pipeline execution health — plus the last collection cycle, configuration and Actuator health components. |
| Failure Analysis | `/failure-analysis` | Failure KPIs and trend, most failing pipelines and tasks, failure reasons, recent failures. |
| Settings | `/settings` | Backend info (`/actuator/info`), monitoring configuration, resolved API URLs with a connection test, browser-local display preferences. |

Shared behaviour: one refresh clock drives every page (toolbar refresh, auto-refresh 15 s – 5 min, paused while the
tab is hidden); in-flight requests are cancelled when a newer one starts; stale data stays on screen while
refreshing; loading skeletons, empty states and error states (with retry) everywhere; collapsible sidebar that
becomes a drawer below 960 px.

## Backend API integration

Every call goes to a real backend endpoint; no mock data ships with the app.

| Endpoint | Used by |
|---|---|
| `GET /api/v1/dashboard/summary?range&namespace` | Overview KPIs and duration metrics, Failure Analysis KPIs, Monitoring (pipeline health, last 24 h) |
| `GET /api/v1/dashboard/trends?range&namespace` | Overview execution and failure trends, Failure Analysis trend |
| `GET /api/v1/pipelines?namespace&pipelineName&status&from&to&page&size&sort` | Pipeline Runs list, Overview recent runs, Failure Analysis (failed runs) |
| `GET /api/v1/pipelines/{id}` · `GET /api/v1/pipelines/{id}/tasks` | Pipeline Run details and timeline |
| `GET /api/v1/tasks?namespace&pipelineName&pipelineRunName&taskName&status&from&to&page&size&sort` | Task Runs list, Overview recent task runs, Failure Analysis (failed tasks) |
| `GET /api/v1/tasks/{id}` | Task Run details |
| `GET /api/v1/collector/status` | Top bar and sidebar collector status, namespace filter options, Monitoring, Settings |
| `GET /actuator/health` | Monitoring (application health and components) |
| `GET /actuator/info` | Settings (application information) |

Conventions followed: zero-based `page`, `size` capped at 100, `sort=<property>,<asc|desc>` limited to the backend's
allow-list, `from` inclusive / `to` exclusive on start time, `ErrorResponse` bodies mapped to typed errors by
`HttpErrorInterceptor`. Name filters are **exact matches** in the backend, and the UI says so.

### Awaiting backend support

Shown as clearly labelled placeholders, never with sample data:

- AI root-cause analysis, recommended actions, failure categorisation and pattern detection.
- TaskRun time series (the trends endpoint covers PipelineRuns only).
- PipelineRun / TaskRun parameters, results, labels, annotations and step details (not collected).
- `PENDING` and `CANCELLED` states: the backend normalises to `RUNNING`, `SUCCEEDED`, `FAILED`, `UNKNOWN`
  (the status badge already supports the extra states).
- Partial-text search (the backend filters by exact name).
- Notifications and user/profile menu (the backend has no authentication).

Failure breakdowns are computed from the 100 most recent failed PipelineRuns and TaskRuns in the window (one API
page); the page says so when more failures exist.

## Project structure

```
src/app/
  core/          singletons: API services, interceptors, guard, stores, models (CoreModule)
  shared/        reusable components, pipes, directive, Material module (SharedModule)
    charts/      Chart.js components (ChartsModule, lazy: only Overview and Failure Analysis load Chart.js)
  layout/        shell, sidebar, top bar, breadcrumbs; routes to the lazy features (LayoutModule)
  features/
    dashboard/  pipeline-runs/  task-runs/  monitoring/  failure-analysis/  settings/
src/styles/      design tokens, Material theme, utilities, Material overrides
nginx/           Nginx site template (SPA at / + backend proxy under /agent)
k8s/             Deployment, Service and Ingress
```

Reusable components: KPI card, status badge, page header, breadcrumb, data table, filter bar, date range filter,
time range selector, loading skeleton, empty state, error state, confirm dialog, duration, execution timeline,
refresh button, chart card, pending-feature panel; pipes `duration`, `relativeTime`, `firstFailedTask`; directive
`appCopyToClipboard`.

## Run locally

Requirements: Node.js 18 LTS (Angular 16 supports Node 16.14+ / 18.10+) and the backend on `localhost:8080`.

```powershell
npm ci
```

```powershell
npm start
```

Open <http://localhost:4200/>. `proxy.conf.json` forwards `/agent/api` and `/agent/actuator` to
`http://localhost:8080`, stripping `/agent`, exactly like the deployed Nginx.

| Command | Purpose |
|---|---|
| `npm run build` | Production build into `dist/cicd-reliability-ui` (base href `/`) |
| `npm test` | Unit tests (Karma, Chrome) |
| `npm run test:ci` | Headless single run with coverage |

## Configuration

`src/environments/environment.ts` — the SPA is served from the root (`<base href="/">`); backend URLs point at the
backend under its own `/agent` prefix:

| Key | Default | Meaning |
|---|---|---|
| `apiBaseUrl` | `http://65.0.96.142/agent/api/v1` | REST API base |
| `actuatorBaseUrl` | `http://65.0.96.142/agent/actuator` | Actuator base |
| `apiDocsUrl` | `http://65.0.96.142/agent/swagger-ui.html` | Swagger UI |
| `autoRefreshIntervalMs` | `30000` | Default auto-refresh interval |

## Docker

Multi-stage build: Node 18 builds the app, unprivileged Nginx (UID 101, port 8080) serves it at `/`.

```powershell
docker build -t ghcr.io/rafik790/hackathon-ai-frontend:1.0.0 .
```

```powershell
docker run --rm -p 8081:8080 -e BACKEND_URL=http://host.docker.internal:8080 ghcr.io/rafik790/hackathon-ai-frontend:1.0.0
```

Open <http://localhost:8081/>.

Nginx (`nginx/default.conf.template`):

- `/*` serves the SPA; unknown paths fall back to `/index.html`, so deep links and browser refresh work.
- `/agent/api/*`, `/agent/actuator/*`, `/agent/v3/api-docs*`, `/agent/swagger-ui*` are proxied to `BACKEND_URL`
  with `/agent` stripped.
- Hashed bundles are cached for a year, `index.html` is always revalidated, `/healthz` serves probes.
- `BACKEND_URL` is resolved per request (nginx starts even if the backend is not up yet) and must be a fully
  qualified name, e.g. `http://hackathon-ai-agent.<namespace>.svc.cluster.local:8080`.

## Kubernetes

1. Push the image, and set `image` and `BACKEND_URL` in `k8s/frontend.yaml` (use the namespace of the backend
   Service).
2. Apply it in the agent namespace:

   ```powershell
   kubectl apply -n <agent-namespace> -f k8s/frontend.yaml
   ```

3. Routing: the Ingress sends `/` to the frontend; the backend keeps its own `/agent` Ingress rule (the longer
   prefix wins). The rule has no `host`, so it keeps working when the EC2 public IP changes.
4. Allow the browser origin in the backend only if you serve the UI from a different origin; behind the same
   Ingress no CORS configuration is needed.


## Quality checks

- `npm run build` (production, strict TypeScript and strict templates) — passes, no budget warnings.
- `npm run test:ci` — unit tests for API services, error interceptor, load-state operator, guard, collector
  health, list-query state, duration formatting, failure aggregation, monitoring dimensions, status badge and
  execution timeline.
