# Incident response runbook

## Triage

1. Name an incident lead and record start time, affected environment and user impact.
2. Check `/health/live`, `/health/startup`, `/health/ready`, error ratio, latency, saturation and database connection usage.
3. Correlate `X-Request-Id` with JSON logs and `X-Trace-Id` with traces. Never paste tokens or personal data into the incident channel.
4. Determine whether the last deploy, migration, dependency outage or configuration change aligns with onset.

## Contain and recover

- Code regression: halt rollout or restore the last known-good image.
- Database pressure: remove traffic, reduce concurrency and identify slow/blocked queries before scaling connections.
- Bad migration: prefer a compatible forward fix. Restore only after validating backup age and data-loss scope.
- Credential exposure: revoke and rotate first, invalidate affected refresh sessions, then remove the credential from source and history as appropriate.
- Mobile release: stop rollout where the store permits; issue a compatible corrective OTA update or require a native update according to the update policy.

Do not declare recovery from a single successful request. Confirm health over an observation window and verify user-facing paths, queues/webhooks, metrics and error reporting.

## Follow-up

Within the post-incident review, document timeline, contributing conditions, detection gaps, user impact, remediation owners and dates. Add a regression test or automated guard for every practical corrective action. Preserve operational evidence according to the product's retention policy.
