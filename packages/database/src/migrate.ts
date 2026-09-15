import { resolve } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabaseConnection, requireDatabaseUrl } from "./client.js";

export async function migrateDatabase(
  url = requireDatabaseUrl(),
  migrationsFolder = process.env.MIGRATIONS_DIR ?? resolve(process.cwd(), "migrations"),
) {
  const connection = createDatabaseConnection(url);
  try { await migrate(connection.db, { migrationsFolder }); }
  finally { await connection.close(); }
}
