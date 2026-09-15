# Deployment runbook

## Before deployment

1. Confirm the target commit passed CI and `pnpm security:check`.
2. Review application, environment, OpenAPI, and migration diffs.
3. Verify a recent backup can restore with `pnpm db:restore:verify`.
4. Confirm production `DATABASE_URL`, `AUTH_JWT_SECRET`, CORS origins and observability settings in the secret/configuration store.
5. Build the exact artifact with `pnpm build` and `pnpm docker:build`.

## Deploy

1. Run `pnpm db:migrate` as a one-off job using the direct database URL. Do not run migrations independently from every API replica.
2. Deploy the immutable API image and wait for `/health/startup` and `/health/ready` before admitting traffic.
3. Deploy static Admin and Landing artifacts.
4. For mobile, run `pnpm mobile:build:production`; submit only after preview verification. Use OTA updates only when the native runtime version remains compatible.
5. Verify `/health/live`, `/health/ready`, one authenticated request, logs, metrics and traces.

## Rollback

Roll back the application image for code-only regressions. Prefer a forward-fix migration for schema problems because old application binaries may not understand a reverted schema. Stop and restore a database backup only under the incident lead's decision after recovery-point impact is understood and restoration has been rehearsed.

Record the deployed commit, image digest, migration journal state, EAS build/update IDs, verification result, operator and timestamps.
