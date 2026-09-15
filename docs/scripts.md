# Script catalog

Monoplate keeps every executable repository tool under `tooling/scripts/`. The initializer remains the stable bootstrap contract called by `monoplate-cli`, but follows the same location rule as all other scripts.

## Naming rules

- `tooling/scripts/init-workspace.mjs`: one-time initialization after the template is cloned
- `tooling/scripts/check-*.mjs`: read-only validation; must not modify the worktree
- `tooling/scripts/generate-*.mjs`: deterministic generated-file updates
- `tooling/scripts/list-*.mjs`: read-only discovery and human-readable output
- `tooling/scripts/create-*.mjs`: scaffolding inside an initialized project
- `tooling/scripts/prepare-*.mjs`: build-context generation; never edits source files in place

All new scripts use ESM, Node built-ins where practical, non-zero exit codes on failure, and arguments rather than project-specific environment-variable names.

## Confirmed scripts

| Command | File | State | Responsibility |
|---|---|---|---|
| `pnpm run init` | `tooling/scripts/init-workspace.mjs` | Implemented | Transactionally replace identity values, record optional feature selections and generated-file provenance, reject configuration drift, and safely no-op when repeated with identical arguments. |
| `pnpm check:architecture` | `tooling/scripts/check-architecture.mjs` | Implemented | Enforce domain/application/adapter imports and public package boundaries from a declarative configuration. |
| `pnpm domains` | `tooling/scripts/list-domains.mjs` | Implemented | List bounded contexts from domain manifests without parsing a TypeScript composition root. |
| `pnpm tokens:generate` | `tooling/scripts/generate-tokens.mjs` | Implemented | Generate TypeScript, NativeWind/Tailwind, and web CSS tokens from `tokens.json`. |
| `pnpm tokens:check` | `tooling/scripts/generate-tokens.mjs --check` | Implemented | Fail when committed generated theme files differ from the token source. |
| `pnpm generate:domain` | `tooling/scripts/create-domain.mjs` | Implemented | Scaffold a bounded context, CRUD repository port, use case, in-memory API adapter, contracts, tests, package metadata, API dependency, and composition-root registration. |
| `pnpm generate:route` | `tooling/scripts/create-route.mjs` | Implemented | Scaffold a GET/POST/PUT/PATCH/DELETE use case, Zod request/response contract, OpenAPI Hono adapter, tests, public exports, and module registration. |
| `pnpm check:api-bundle` | `tooling/scripts/check-api-bundle.mjs` | Implemented | Start the final API bundle, call health/readiness endpoints, verify module resolution, then terminate it gracefully. |
| `pnpm docker:smoke` | `tooling/scripts/check-docker-image.mjs` | Implemented | Run the built API image, wait for readiness, call health endpoints, and verify graceful container shutdown. |

## Review of previous scripts

### Architecture boundary checker

Previous responsibility:

- scan TypeScript imports;
- apply different import rules to ports, factories, domain files, and adapters;
- reject forbidden runtime dependencies in domain `package.json` files;
- verify required imports in composition roots.

Decision: **retain the responsibility and rewrite for Monoplate**.

Changes required:

- use `domains/*`, `apps/*`, and `packages/*` rather than the previous repository paths;
- resolve the generated namespace from `.monoplate/project.json`, not a hardcoded `@kg/` prefix;
- treat `public.ts` and `package.json#exports` as the public boundary;
- combine this structural check with ESLint import restrictions;
- exclude all test fixtures through configuration rather than hardcoded filenames;
- correct the pasted import regular expressions, whose Markdown formatting damaged their capture groups.

This checker must remain read-only.

### Domain list script

Previous responsibility:

- parse `servers/api/src/bootstrap/modules.ts` with a regular expression;
- print valid values for `ENABLED_DOMAINS`;
- share the discovery function with the initializer.

Decision: **retain the user-facing capability but replace the source of truth**.

Each bounded context should expose a small manifest:

```json
{
  "name": "identity",
  "kind": "domain",
  "defaultEnabled": true
}
```

`list-domains.mjs` will enumerate `domains/*/domain.json`. It should not parse a composition-root TypeScript file because formatting changes can silently break discovery.

The initializer records optional platform features in `.monoplate/project.json`. Pass `--with-admin`, `--with-sentry`, `--with-auth`, `--with-database`, `--with-eas`, or `--with-observability` with `true` or `false`. Authentication requires the database feature. These selections are stable input for `monoplate-cli`; application composition remains safe when provider credentials or optional endpoints are absent.

Initializer golden tests cover multiple namespaces, localized display names, custom bundle identifiers, paths containing spaces, identical reruns, invalid feature dependencies, and injected mid-write rollback. The template workflow runs these tests on Windows, macOS, and Linux.

### Build-time domain trimmer

Previous responsibility:

- read `ENABLED_DOMAINS`;
- modify a copied API composition root and its `package.json`;
- run `turbo prune` so inactive domain packages and transitive dependencies disappear from the Docker context.

Decision: **do not port to Monoplate v1**.

Reasons:

- Monoplate currently produces one API bundle containing source-first workspace packages;
- deployment behavior should not vary from an environment variable supplied only during Docker build;
- regular-expression rewriting of executable TypeScript is fragile;
- changing a service's installed capabilities per image complicates migrations, observability, and incident diagnosis;
- a domain shared by other domains cannot safely be classified only from composition-root imports.

If image variants are needed later, `prepare-api-variant.mjs` should generate a temporary composition root from domain manifests. It must never edit tracked source or `package.json` files, even inside a local checkout.

### Production dist wiring verifier

Previous responsibility:

- temporarily repoint every workspace package from `src` to `dist`;
- boot built servers with plain Node;
- detect ESM and module-resolution failures;
- restore all modified `package.json` files.

Decision: **replace rather than port**.

The old script solves a package-per-dist deployment model that Monoplate intentionally does not use. Monoplate's internal packages have no `dist`; the API build bundles their TypeScript source into `apps/api/dist/server.cjs`.

The replacement `check-api-bundle.mjs` should:

1. require that the final API artifact exists;
2. spawn it with an isolated port and minimal validated environment;
3. wait for a structured `API started` log or readiness response;
4. call `/health/live` and `/health/ready`;
5. fail on module-resolution and startup errors;
6. send `SIGTERM` and require a clean shutdown within a timeout.

It must not rewrite or restore package manifests. Docker behavior is verified separately by `check-docker-image.mjs`.

## Proposed layout

```text
monoplate/
└── tooling/
  └── scripts/
    ├── check-api-bundle.mjs
    ├── check-architecture.mjs
    ├── check-docker-image.mjs
    ├── check-tokens.mjs
    ├── create-domain.mjs
    ├── create-route.mjs
    ├── generate-tokens.mjs
    └── list-domains.mjs
```

Domain and route scaffolding use the namespace resolved from `.monoplate/project.json` (falling back to the API package scope), refuse to overwrite existing files, and deterministically regenerate public exports and composition indexes.
