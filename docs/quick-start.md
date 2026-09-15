# 5-minute quick start

## Prerequisites

- Node.js 24 or later
- pnpm 11.24.0 (enable it with `corepack enable`)
- Docker with Compose

## Start the local stack

```sh
cp .env.example .env
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm db:seed
pnpm dev
```

The API listens on `http://localhost:3000`, Admin on `http://localhost:5173`, and Landing on `http://localhost:4321`. Expo prints the mobile development URL in the terminal. Confirm the API with:

```sh
curl http://localhost:3000/health/live
curl http://localhost:3000/health/ready
```

To create the first administrator, replace the example bootstrap password in `.env` with a strong value and run `pnpm auth:bootstrap`. Remove the bootstrap credentials from the runtime environment afterwards.

Before committing, run `pnpm check` and `pnpm security:check`. Stop the local database with `pnpm docker:down`; add `--volumes` manually only when intentionally deleting local database data.

## Initialize a new product

Run this once in a fresh template checkout, before application changes:

```sh
pnpm init -- --yes --name acme --namespace acme --displayName "Acme" \
  --iosBundleIdentifier com.example.acme --androidPackage com.example.acme
pnpm install --lockfile-only
pnpm check
```

Initialization records the chosen identity in `.monoplate/project.json`. Commit that file with the initialized project.
