import { sql } from "drizzle-orm";
import { createDatabaseConnection, requireDatabaseUrl } from "#database/client.js";
import { appSettings } from "#database/schema/app-settings.js";
import "./load-environment.js";

export async function seedDatabase(url = requireDatabaseUrl()) {
  const connection = createDatabaseConnection(url);
  try {
    await connection.db.insert(appSettings).values({ key: "app", value: { initialized: true } }).onConflictDoUpdate({
      target: appSettings.key,
      set: { value: { initialized: true }, updatedAt: sql`now()` },
    });
  } finally {
    await connection.close();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) await seedDatabase();
