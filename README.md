# Monoplate

An opinionated SaaS monorepo starter built around a package-enforced hexagonal modular monolith.

## Applications

- `apps/api`: Hono API on Node.js
- `apps/mobile`: Expo and React Native
- `apps/admin`: React and Vite admin SPA
- `apps/landing`: Astro static landing site

## Architecture

- `domains/*`: bounded contexts with domain, application ports, and use cases
- `packages/*`: platform-neutral contracts and technical adapters
- applications are composition roots and own deployment concerns
- internal packages export TypeScript source; applications produce final artifacts

## Start

```bash
pnpm run init -- --namespace xierra --name my-saas
cp .env.example .env
pnpm install
pnpm db:up
pnpm db:migrate
pnpm auth:bootstrap
pnpm check
pnpm dev
```

Set `AUTH_JWT_SECRET` to at least 32 random characters and configure the paired `AUTH_BOOTSTRAP_EMAIL` and `AUTH_BOOTSTRAP_PASSWORD` values before bootstrapping the first administrator. Access tokens are short-lived JWTs; rotating refresh sessions are stored as hashes in PostgreSQL. The Admin SPA and Mobile `AuthProvider` use the versioned `/api/v1/auth/login`, `/api/v1/auth/refresh`, `/api/v1/auth/logout`, and `/api/v1/auth/me` contract.

Environment variables are parsed by `@monoplate/config`. Run `pnpm env:check` to validate server, Vite, and Expo public configuration. Production refuses to start without `DATABASE_URL` and `AUTH_JWT_SECRET`; server-only variables are not exported through the package's client entry point.

The initializer also supports an interactive mode with `pnpm run init`. It replaces the complete workspace namespace, project identifiers, app display name, database defaults, Docker image name, and lockfile references. Optional `--with-admin`, `--with-sentry`, `--with-auth`, `--with-database`, `--with-eas`, and `--with-observability` booleans are recorded in the project manifest. Writes are transactional, identical reruns are no-ops, and different reruns are rejected to prevent identity drift. `monoplate-cli` will run this initializer before dependency installation.

## Boundaries

Domain code cannot import Hono, Drizzle, Pino, React, Expo, Zod, or environment variables. Client applications cannot import server domains or database packages.

Start with the [`5-minute quick start`](docs/quick-start.md) and use the [`documentation index`](docs/README.md) for architecture decisions, environment variables, runbooks, troubleshooting, contributions, and template migrations. See [`docs/scripts.md`](docs/scripts.md) for the initializer, validation, and generation script catalog.
Operational conventions are documented in [`docs/api-operations.md`](docs/api-operations.md), [`docs/database-operations.md`](docs/database-operations.md), and [`docs/observability.md`](docs/observability.md).
External email, storage, billing, and job boundaries are documented in [`docs/integrations.md`](docs/integrations.md). Security reporting and automated checks are described in [`SECURITY.md`](SECURITY.md).

## Generate an API domain

Create the bounded context before adding routes:

```bash
pnpm generate:domain -- --name catalog --entity product --description "Product catalog"
```

This creates the pure `Product` model, application repository port and list use case under `domains/catalog`; the Zod transport model under `packages/contracts`; and an in-memory outbound adapter plus module composition under `apps/api`. It also declares the workspace dependency, refreshes the lockfile, and registers the module automatically. Replace the generated in-memory adapter with a database adapter without changing the domain.

Names must be lowercase kebab-case. `--entity` controls the exported PascalCase entity name and defaults to the domain name.

## Generate an API route

```bash
pnpm generate:route -- --domain catalog --name list-products --method get
pnpm generate:route -- --domain catalog --name create-product --method post
pnpm generate:route -- --domain catalog --name update-product --method patch --path /api/v1/catalog/{id}
```

Supported methods are `get`, `post`, `put`, `patch`, and `delete`. Default paths are `/api/v1/<domain>` for GET/POST and `/api/v1/<domain>/{id}` for PUT/PATCH/DELETE. Hono-style `:id` input is normalized to the OpenAPI `{id}` form.

Each command creates and wires:

- a framework-free application use case in the selected domain;
- request and response Zod schemas in `packages/contracts`;
- an OpenAPI Hono inbound adapter in `apps/api/src/modules/<domain>/http`;
- a use-case unit test and route contract tests;
- package exports and module composition registration.

Generated handlers parse outgoing data with their response schema. Invalid request data returns `{ error: { code, message, requestId, details } }` with status 400. Application `NOT_FOUND` errors map to 404 and unexpected errors map to 500. The generated OpenAPI 3.1 document is served at `GET /openapi.json`.

After editing generated code, run the complete gate:

```bash
pnpm check
pnpm api:dev
```
