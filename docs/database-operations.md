# Database operations

Application traffic uses `DATABASE_URL`. Migrations and backups prefer the direct `DATABASE_URL_UNPOOLED`; never run session-dependent administration through a transaction pooler.

`pnpm db:migrations:check` rejects destructive SQL unless the migration contains `-- monoplate:allow-destructive <reason>`. Production containers do not migrate during API startup: the Compose `migrate` service must complete before `api` starts.

Create a custom-format backup with `BACKUP_FILE=./backup.dump pnpm db:backup`. Verify it only against a database whose name ends in `_test` using `BACKUP_FILE=./backup.dump DATABASE_URL=..._test pnpm db:restore:verify`. A backup is not considered valid until restore verification succeeds.

Use `withTransaction` for multi-write application operations. Pool size, connect/idle timeout, statement timeout, and idle-in-transaction timeout are controlled by the validated `DB_*` environment variables.
