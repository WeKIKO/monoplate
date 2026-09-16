import { resolve } from "node:path";
import { loadWorkspaceEnvironment } from "@monoplate/config/load";
import { migrateDatabase, requireDatabaseUrl } from "@monoplate/database";
import { parseServerEnv } from "@monoplate/config/server";

loadWorkspaceEnvironment();
const migrationsFolder = resolve(process.env.MIGRATIONS_DIR ?? "./migrations");
const env = parseServerEnv();
await migrateDatabase(env.DATABASE_URL_UNPOOLED ?? requireDatabaseUrl(), migrationsFolder);
