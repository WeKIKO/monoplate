# Monoplate architecture

Monoplate is a package-enforced hexagonal modular monolith. It starts as one API deployment while bounded contexts remain extractable into services.

## Decisions

- Node.js 24 is the tested runtime; TypeScript and ESM are the source format.
- pnpm workspaces and Turborepo orchestrate the repository.
- Hono is the inbound HTTP adapter.
- Domain and application code cannot depend on Hono, Drizzle, Pino, Zod, React, Expo, or environment variables.
- Pino implements the dependency-free `Logger` port at the API boundary.
- Internal packages export TypeScript source and do not produce their own `dist` folders.
- Each application compiles its workspace dependencies into its final artifact.
- Mobile preferences and query cache use AsyncStorage; credentials use Expo SecureStore. MMKV is an optional adapter, not a default dependency.
- Mobile uses Expo, Expo Router, NativeWind, persisted TanStack Query, i18n, splash orchestration, and root-level commands.
- Admin uses React and Vite. Landing uses static Astro with SEO metadata and sitemap generation.
- Authentication is single-tenant: users have an `admin` or `member` role, password hashing and JWT implementation remain outbound adapters, and refresh sessions are revocable database records.
- `@monoplate/config` validates server-only and client-public environment contracts at their respective composition roots.

## Dependency rules

```text
apps/api -> domain public API -> application -> domain
                                ^
                                |
                             adapters

apps/mobile -> contracts / api-client / design-tokens
apps/admin  -> contracts / api-client / design-tokens
```

Applications are composition roots. Cross-domain consumers may use only another domain's public application API or a port implemented by an adapter. Deep imports are forbidden.

## Artifact policy

- `packages/*` and `domains/*`: source-first, no independent build artifact
- `apps/api`: one bundled Node artifact used by Docker
- `apps/admin`: static Vite artifact
- `apps/landing`: static Astro artifact
- `apps/mobile`: Metro/EAS artifact

## Naming

- Product and template repository: `monoplate`
- Dedicated generator repository and CLI: `monoplate-cli`
- Generated workspace namespace: replaced by the CLI from user input

The CLI bootstrap contract is `tooling/scripts/init-workspace.mjs`. All repository generation and verification scripts live together under `tooling/scripts/`.
