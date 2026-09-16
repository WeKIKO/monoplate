#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env"), quiet: true });
const [command, profileOrPlatform] = process.argv.slice(2);
const allowed = new Set(["setup", "build", "update", "submit"]);
if (!command || !allowed.has(command)) throw new Error("Usage: pnpm mobile:eas <setup|build|update|submit> [profile|platform]");
const projectId = process.env.EAS_PROJECT_ID?.trim();
if (!projectId) throw new Error("EAS_PROJECT_ID is required. Add it to .env or CI secrets.");
if (process.env.CI && !process.env.EXPO_TOKEN?.trim()) throw new Error("EXPO_TOKEN is required for non-interactive CI runs.");
if (process.env.EXPO_PUBLIC_SENTRY_DSN && command !== "setup" && !process.env.SENTRY_AUTH_TOKEN?.trim()) throw new Error("SENTRY_AUTH_TOKEN is required when Sentry is enabled for EAS publishing.");

const args = command === "setup"
  ? ["init", "--id", projectId]
  : command === "build"
    ? ["build", "--platform", "all", "--profile", profileOrPlatform ?? "preview"]
    : command === "update"
      ? ["update", "--environment", profileOrPlatform ?? "preview"]
      : ["submit", "--platform", profileOrPlatform ?? "all", "--profile", "production"];
if (process.env.CI) args.push("--non-interactive");
// EAS is a release-only tool. Run a pinned version on demand so its large CLI
// dependency tree does not become part of every workspace installation.
const result = spawnSync("pnpm", ["dlx", "eas-cli@24.6.0", ...args], { cwd: resolve(process.cwd(), "apps/mobile"), stdio: "inherit", env: process.env });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
