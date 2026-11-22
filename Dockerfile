# syntax=docker/dockerfile:1

# ---------- Build stage ----------
# Angular 16 supports Node 16.14+/18.10+; Node 18 LTS is used for a reproducible build.
FROM docker.io/library/node:18.20-alpine AS build
WORKDIR /workspace

# Install dependencies first so they are cached between source changes.
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY angular.json tsconfig.json tsconfig.app.json ./
COPY src src
RUN npm run build

# ---------- Runtime stage ----------
# Unprivileged nginx (UID 101, port 8080). Its entrypoint renders /etc/nginx/templates/*.template.
FROM docker.io/nginxinc/nginx-unprivileged:1.27-alpine

LABEL org.opencontainers.image.title="hackathon-ai-frontend" \
      org.opencontainers.image.description="CI/CD Reliability AI Agent - Angular frontend" \
      org.opencontainers.image.source="https://github.com/rafik790/hackathon-ai-frontend"

# BACKEND_URL must be a fully qualified name (nginx's resolver ignores DNS search domains).
ENV BACKEND_URL=http://hackathon-ai-agent.default.svc.cluster.local:8080 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1

COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /workspace/dist/cicd-reliability-ui /usr/share/nginx/html

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
