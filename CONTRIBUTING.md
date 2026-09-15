# Contributing

Use Node.js 24 and pnpm 11.24.0. Create focused branches from `develop`; `release` is the verified release branch. Do not commit `.env`, credentials, local storage, database dumps or build output.

## Workflow

1. Install with `pnpm install --frozen-lockfile`.
2. Add tests with behavior changes and update contracts/migrations when applicable.
3. Run `pnpm check` and `pnpm security:check`.
4. Run `pnpm mobile:doctor` for mobile dependency/configuration changes and `pnpm docker:smoke` after building an API image when container behavior changes.
5. Submit a focused pull request describing behavior, migration/deployment impact, evidence and rollback plan.

Use Conventional Commit-style subjects such as `feat(api): add catalog endpoint` or `fix(mobile): recover failed OTA update`. Do not mix generated drift, dependency upgrades and unrelated refactors. Generated changes must include their editable source and generation command.

Schema changes require reviewed migration SQL and a test against a disposable database. API changes require regenerated OpenAPI/client artifacts. New external vendors implement an existing integration port and keep SDK types behind the adapter boundary. Security reports follow `SECURITY.md`, not public issues.

By contributing, you agree that your contribution is licensed under this repository's MIT License.
