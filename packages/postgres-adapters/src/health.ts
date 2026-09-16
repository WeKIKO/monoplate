import type { Database } from "@monoplate/database";
import type { ReadinessProbe } from "@monoplate/health";
import type { Logger } from "@monoplate/logger";
import { sql } from "drizzle-orm";

export class PostgresReadinessProbe implements ReadinessProbe {
  constructor(private readonly database: Database, private readonly logger: Logger) {}

  async check() {
    try {
      await this.database.execute(sql`select 1`);
      return true;
    } catch (error) {
      this.logger.error("Database readiness check failed", error);
      return false;
    }
  }
}
