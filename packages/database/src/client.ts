import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres, { type Sql } from "postgres";

export type Database = PostgresJsDatabase;

export type DatabaseConnection = Readonly<{
  db: Database;
  client: Sql;
  close(): Promise<void>;
}>;

export type DatabaseConnectionOptions = Readonly<{ max?: number; idleTimeoutSeconds?: number; connectTimeoutSeconds?: number; statementTimeoutMs?: number; applicationName?: string }>;
export function createDatabaseConnection(url: string, options: DatabaseConnectionOptions = {}): DatabaseConnection {
  const client = postgres(url, { max: options.max ?? 10, idle_timeout: options.idleTimeoutSeconds ?? 20, connect_timeout: options.connectTimeoutSeconds ?? 10, connection: { application_name: options.applicationName ?? "monoplate", statement_timeout: options.statementTimeoutMs ?? 10_000, idle_in_transaction_session_timeout: options.statementTimeoutMs ?? 10_000 } });
  return {
    db: drizzle(client),
    client,
    close: () => client.end({ timeout: 5 }),
  };
}

export async function withTransaction<T>(database: Database, operation: (transaction: Database) => Promise<T>): Promise<T> {
  return database.transaction((transaction) => operation(transaction as Database));
}

export function requireDatabaseUrl(environment: NodeJS.ProcessEnv = process.env) {
  const value = environment.DATABASE_URL?.trim();
  if (!value) throw new Error("DATABASE_URL is required");
  return value;
}
