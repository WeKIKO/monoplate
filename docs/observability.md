# Observability and runbook

`/health/live` checks the process, `/health/startup` checks startup dependencies, `/health/ready` controls traffic admission, and `/metrics` exposes Prometheus text metrics. Logs are JSON and correlate request ID and OpenTelemetry trace ID; authorization and token fields are redacted.

Set `OTEL_EXPORTER_OTLP_ENDPOINT` to enable the OTLP HTTP exporter. Mobile Sentry reports include app slug/version, update ID, and environment. EAS publishing requires the Sentry token when a DSN is configured.

Alert on sustained readiness failures, elevated 5xx ratio, timeout growth, or database connection exhaustion. First correlate `X-Request-Id` with logs and `X-Trace-Id` with the trace backend, then check readiness and database latency. Roll back application code for code regressions; database changes use forward-fix migrations unless a tested restore is explicitly required.
