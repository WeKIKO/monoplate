import { defineConfig } from "drizzle-kit";
import { loadWorkspaceEnvironment } from "@monoplate/config/load";

loadWorkspaceEnvironment(import.meta.dirname);

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/schema/*.ts",
  out: "./migrations",
  dbCredentials: { url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:5432/monoplate" },
  strict: true,
  verbose: true,
});
