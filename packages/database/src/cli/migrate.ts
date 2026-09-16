import { migrateDatabase } from "#database/migrate.js";
import { workspaceEnvironmentPath } from "./load-environment.js";

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
  if (!url) throw new Error(`DATABASE_URL_UNPOOLED or DATABASE_URL is required. Add it to ${workspaceEnvironmentPath} or provide it in the process environment.`);
  await migrateDatabase(url);
}
