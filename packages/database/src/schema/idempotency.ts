import { index, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";
export const idempotencyKeys = pgTable("idempotency_keys", {
  key: text("key").primaryKey(), method: text("method").notNull(), path: text("path").notNull(), responseStatus: integer("response_status").notNull(), responseBody: jsonb("response_body").notNull(), expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(), createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => [index("idempotency_keys_expires_at_idx").on(table.expiresAt)]);
