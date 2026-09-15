# Template and product migration guide

Monoplate uses semantic versions for tagged template releases. A generated product is a forked codebase, not a package that receives automatic template upgrades.

For each template upgrade:

1. Read `CHANGELOG.md` from the current product version through the target version.
2. Create a dedicated branch and ensure the working tree is clean.
3. Compare template changes by subsystem; apply code and configuration changes deliberately instead of rerunning the initializer.
4. Preserve `.monoplate/project.json`, product identifiers, environment configuration and product-specific domain code.
5. Regenerate deterministic artifacts and run `pnpm check`, `pnpm security:check`, `pnpm mobile:doctor`, database migration tests and a Docker smoke test.
6. Deploy through preview before production and record the adopted template version in the product changelog.

Breaking template changes require a `MIGRATION` entry in `CHANGELOG.md` with exact commands, manual edits and rollback notes. Database migrations remain forward-only after deployment. Changes to bundle identifiers, signing credentials, authentication claims, public API versions or native runtime versions require their own product migration plan.
