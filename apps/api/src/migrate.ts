import { resolve } from "node:path";
import { migrateDatabase, requireDatabaseUrl } from "@monoplate/database";
import { parseServerEnv } from "@monoplate/config/server";

const migrationsFolder = resolve(process.env.MIGRATIONS_DIR ?? "./migrations");
const env = parseServerEnv();
await migrateDatabase(env.DATABASE_URL_UNPOOLED ?? requireDatabaseUrl(), migrationsFolder);
