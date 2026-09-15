import { and, eq, gt } from "drizzle-orm";
import type { Database } from "../client.js";
import { idempotencyKeys } from "../schema/idempotency.js";
export type IdempotencyRecord = Readonly<{ method: string; path: string; status: number; body: unknown }>;
export class IdempotencyRepository {
  constructor(private readonly database: Database) {}
  async get(key: string): Promise<IdempotencyRecord | undefined> { const [row] = await this.database.select().from(idempotencyKeys).where(and(eq(idempotencyKeys.key, key), gt(idempotencyKeys.expiresAt, new Date()))).limit(1); return row ? { method: row.method, path: row.path, status: row.responseStatus, body: row.responseBody } : undefined; }
  async put(key: string, value: IdempotencyRecord, expiresAt: Date) { await this.database.insert(idempotencyKeys).values({ key, method: value.method, path: value.path, responseStatus: value.status, responseBody: value.body, expiresAt }).onConflictDoNothing(); }
}
