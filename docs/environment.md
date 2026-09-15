# Environment variables

Copy `.env.example` to `.env` for local development. `.env` is a secret-bearing local file and must not be committed. Public-prefixed variables are embedded in client bundles and must never contain secrets.

## API and database

| Variable | Required | Default / purpose |
|---|---:|---|
| `NODE_ENV` | No | `development`; one of `development`, `test`, `production` |
| `PORT` | No | `3000` |
| `DATABASE_URL` | Production | Application/pooler PostgreSQL URL |
| `DATABASE_URL_UNPOOLED` | No | Direct URL preferred by migrations and administration |
| `LOG_LEVEL` | No | `info` |
| `AUTH_JWT_SECRET` | Production | JWT secret, at least 32 characters |
| `AUTH_ACCESS_TTL_SECONDS` | No | `900` |
| `AUTH_REFRESH_TTL_DAYS` | No | `30`, maximum 365 |
| `AUTH_BOOTSTRAP_EMAIL` | Paired | Initial administrator email |
| `AUTH_BOOTSTRAP_PASSWORD` | Paired | Initial password, at least 12 characters |
| `CORS_ORIGINS` | No | Comma-separated allowed origins |
| `API_BODY_LIMIT_BYTES` | No | `1048576` |
| `API_REQUEST_TIMEOUT_MS` | No | `15000` |
| `API_RATE_LIMIT_MAX` | No | `120` requests per window |
| `API_RATE_LIMIT_WINDOW_MS` | No | `60000` |
| `DB_POOL_MAX` | No | `10` |
| `DB_CONNECT_TIMEOUT_SECONDS` | No | `10` |
| `DB_IDLE_TIMEOUT_SECONDS` | No | `20` |
| `DB_STATEMENT_TIMEOUT_MS` | No | `10000` |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | No | Enables OTLP HTTP export when set |
| `OTEL_SERVICE_NAME` | No | `monoplate-api` |

`BACKUP_FILE` is required by backup/restore commands. Restore verification also requires a `DATABASE_URL` whose database name ends in `_test`.

## Web and mobile clients

| Variable | Required | Default / purpose |
|---|---:|---|
| `VITE_API_URL` | No | Admin API URL, embedded publicly |
| `VITE_APP_ENV` | No | `development`, `preview`, or `production` |
| `EXPO_PUBLIC_API_URL` | No | Mobile API URL, embedded publicly; use a reachable host on devices |
| `EXPO_PUBLIC_APP_ENV` | No | `development`, `preview`, or `production` |
| `EXPO_PUBLIC_SENTRY_DSN` | No | Enables mobile Sentry; public DSN only |
| `EXPO_PUBLIC_DEV_HOST` | Physical-device development | LAN hostname/IP used when the configured API URL points to localhost |
| `EXPO_PUBLIC_MINIMUM_APP_VERSION` | No | Lowest allowed semantic app version; older clients are blocked |
| `EXPO_PUBLIC_RECOMMENDED_APP_VERSION` | No | Version below which a dismissible update prompt is shown |
| `EXPO_PUBLIC_APP_STORE_URL` | Update prompts | App/Play Store URL opened by the update gate |
| `APP_NAME` | No | Expo display name |
| `EXPO_SLUG` | No | Expo project slug |
| `APP_SCHEME` | No | Deep-link scheme |
| `APP_ASSOCIATED_DOMAIN` | Universal links | iOS associated domain without the `applinks:` prefix |
| `APP_LINK_HOST` | App links | Android HTTPS host verified by the intent filter |
| `IOS_BUNDLE_IDENTIFIER` | No | Native iOS identifier |
| `ANDROID_PACKAGE` | No | Native Android package |

## EAS and Sentry automation

| Variable | Required | Purpose |
|---|---:|---|
| `EXPO_TOKEN` | EAS CI | Expo authentication token; secret |
| `EAS_PROJECT_ID` | EAS operations | Linked Expo project UUID |
| `SENTRY_AUTH_TOKEN` | Sentry release upload | Secret upload token |
| `SENTRY_ORG` | Sentry integration | Organization slug |
| `SENTRY_PROJECT` | Sentry integration | Project slug |

Run `pnpm env:check` after changing server configuration. Mobile and Admin variables are validated at their respective application composition roots.
