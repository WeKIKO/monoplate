# Troubleshooting

## PostgreSQL is unavailable

Run `docker compose ps` and `pnpm db:up`, then check that port 5432 is free and `DATABASE_URL` names the correct database. `/health/live` can succeed while `/health/ready` fails; readiness intentionally includes the database connection.

## Migration drift or startup failure

Run `pnpm db:migrations:check` and `pnpm db:migrate`. Do not edit a migration already deployed to a shared environment; create a forward-fix migration. For local disposable test data, use `DATABASE_URL=..._test pnpm db:test:reset`.

## Generated API client or tokens are stale

Run `pnpm api:client:generate` or `pnpm tokens:generate`, inspect the diff, and commit the output. CI's contract and token checks are intentionally read-only.

## Mobile cannot reach a local API

`localhost` refers to the device itself. Use `http://10.0.2.2:3000` for the standard Android emulator, `http://localhost:3000` for the iOS simulator, and the development machine's LAN address for a physical device. Set `EXPO_PUBLIC_API_URL` before starting Expo and ensure the firewall permits the connection.

## Expo or EAS configuration fails

Run `pnpm mobile:doctor` first. Use `pnpm mobile:eas:setup` to link the project and provide `EXPO_TOKEN` and `EAS_PROJECT_ID` in CI. If Sentry is enabled, configure all three of `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT` for release upload.

## `pnpm check` passes locally but fails in CI

Use Node 24 and pnpm 11.24.0, install with `pnpm install --frozen-lockfile`, and run against PostgreSQL rather than relying on test doubles. Check for uncommitted generated artifacts with `git status --short` after the command.

## Secret scanning reports a false positive

Do not weaken the scanner globally. Replace realistic example credentials with unmistakable placeholders. If a real credential was committed, revoke and rotate it before removing it from current source; deleting the line does not revoke the credential or erase Git history.
