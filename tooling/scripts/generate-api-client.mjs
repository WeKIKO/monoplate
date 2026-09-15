#!/usr/bin/env node
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { ROOT } from "./lib/workspace.mjs";

const check = process.argv.includes("--check");
const document = join(ROOT, "apps/api/openapi.json");
const output = join(ROOT, "packages/contracts/src/generated/api.ts");
const temporary = await mkdtemp(join(tmpdir(), "monoplate-openapi-"));
const candidate = join(temporary, "api.ts");
const result = spawnSync("pnpm", ["exec", "openapi-typescript", document, "-o", candidate], { cwd: ROOT, stdio: "inherit" });
if (result.status !== 0) process.exit(result.status ?? 1);
if (check) { const [expected, actual] = await Promise.all([readFile(output, "utf8"), readFile(candidate, "utf8")]); if (expected !== actual) { console.error("Generated OpenAPI client is stale. Run: pnpm api:client:generate"); process.exitCode = 1; } }
else { const { copyFile, mkdir } = await import("node:fs/promises"); await mkdir(join(output, ".."), { recursive: true }); await copyFile(candidate, output); }
await rm(temporary, { recursive: true, force: true });
