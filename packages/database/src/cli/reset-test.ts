import { resolve } from "node:path";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { createDatabaseConnection, requireDatabaseUrl } from "../client.js";
import { seedDatabase } from "./seed.js";

const url = requireDatabaseUrl();
const databaseName = new URL(url).pathname.slice(1);
if (!databaseName.endsWith("_test")) throw new Error(`Refusing to reset non-test database: ${databaseName}`);

const connection = createDatabaseConnection(url);
try {
  await connection.client.unsafe("drop schema if exists public cascade");
  await connection.client.unsafe("create schema public");
  await migrate(connection.db, { migrationsFolder: resolve(import.meta.dirname, "../../migrations") });
} finally {
  await connection.close();
}
await seedDatabase(url);
