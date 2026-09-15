import { eq } from "drizzle-orm";
import type { Database } from "../client.js";
import { appSettings } from "../schema/app-settings.js";

export class AppSettingsRepository {
  constructor(private readonly database: Database) {}
  async get<T = unknown>(key: string): Promise<T | undefined> {
    const [row] = await this.database.select().from(appSettings).where(eq(appSettings.key, key)).limit(1);
    return row?.value as T | undefined;
  }
  async set(key: string, value: unknown): Promise<void> {
    await this.database.insert(appSettings).values({ key, value }).onConflictDoUpdate({ target: appSettings.key, set: { value, updatedAt: new Date() } });
  }
}
