import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createDatabaseConnection, type DatabaseConnection } from "#database/client.js";
import { AppSettingsRepository } from "./app-settings-repository.js";

const databaseUrl = process.env.DATABASE_URL;
describe.runIf(Boolean(databaseUrl))("AppSettingsRepository integration", () => {
  let connection: DatabaseConnection;
  let repository: AppSettingsRepository;
  beforeAll(() => { connection = createDatabaseConnection(databaseUrl!); repository = new AppSettingsRepository(connection.db); });
  afterAll(async () => connection.close());
  it("round-trips JSON through PostgreSQL", async () => {
    const key = `test:${Date.now()}`;
    await repository.set(key, { enabled: true });
    await expect(repository.get(key)).resolves.toEqual({ enabled: true });
  });
});
