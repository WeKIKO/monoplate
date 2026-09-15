import { z } from "zod";

const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.url().optional());
export const ServerEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().min(1).max(65_535).default(3000),
  LOG_LEVEL: z.enum(["silent", "trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  DATABASE_URL: optionalUrl,
  DATABASE_URL_UNPOOLED: optionalUrl,
  AUTH_JWT_SECRET: z.string().min(32).optional(),
  AUTH_ACCESS_TTL_SECONDS: z.coerce.number().int().positive().default(900),
  AUTH_REFRESH_TTL_DAYS: z.coerce.number().int().min(1).max(365).default(30),
  AUTH_BOOTSTRAP_EMAIL: z.preprocess((value) => value === "" ? undefined : value, z.email().optional()),
  AUTH_BOOTSTRAP_PASSWORD: z.preprocess((value) => value === "" ? undefined : value, z.string().min(12).optional()),
  CORS_ORIGINS: z.string().default("http://localhost:4321,http://localhost:5173"),
  API_BODY_LIMIT_BYTES: z.coerce.number().int().positive().default(1_048_576),
  API_REQUEST_TIMEOUT_MS: z.coerce.number().int().min(100).default(15_000),
  API_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(120),
  API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  DB_CONNECT_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(10),
  DB_IDLE_TIMEOUT_SECONDS: z.coerce.number().int().positive().default(20),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalUrl,
  OTEL_SERVICE_NAME: z.string().default("monoplate-api"),
}).superRefine((env, context) => {
  if (env.NODE_ENV === "production" && !env.DATABASE_URL) context.addIssue({ code: "custom", path: ["DATABASE_URL"], message: "DATABASE_URL is required in production" });
  if (env.NODE_ENV === "production" && !env.AUTH_JWT_SECRET) context.addIssue({ code: "custom", path: ["AUTH_JWT_SECRET"], message: "AUTH_JWT_SECRET is required in production" });
  if (Boolean(env.AUTH_BOOTSTRAP_EMAIL) !== Boolean(env.AUTH_BOOTSTRAP_PASSWORD)) context.addIssue({ code: "custom", path: ["AUTH_BOOTSTRAP_EMAIL"], message: "Bootstrap email and password must be configured together" });
});
export type ServerEnv = z.infer<typeof ServerEnvSchema>;
export function parseServerEnv(input: NodeJS.ProcessEnv = process.env): ServerEnv { return ServerEnvSchema.parse(input); }
