#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { ROOT } from "./lib/workspace.mjs";
const listed = spawnSync("rg", ["--files", "--hidden", "--no-ignore", "-g", "!pnpm-lock.yaml", "-g", "!sbom.json", "-g", "!**/node_modules/**", "-g", "!**/dist/**", "-g", "!**/.turbo/**", "-g", "!**/.git/**", "-g", "!apps/mobile/ios/**", "-g", "!apps/mobile/android/**", "-g", "!apps/api/openapi.json", "-g", "!packages/contracts/src/generated/**"], { cwd: ROOT, encoding: "utf8" });
if (listed.status !== 0) throw new Error("Unable to enumerate files with rg");
const patterns = [new RegExp("-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----"), new RegExp("gh[pousr]_[A-Za-z0-9]{30,}"), new RegExp("AKIA[0-9A-Z]{16}"), new RegExp("sk-" + "[A-Za-z0-9_-]{24,}"), new RegExp("xox[baprs]-[A-Za-z0-9-]{20,}")];
const failures = [];
for (const file of listed.stdout.trim().split("\n").filter(Boolean)) { if (file === ".env.example") continue; const content = await readFile(`${ROOT}/${file}`, "utf8").catch(() => ""); if (patterns.some((pattern) => pattern.test(content))) failures.push(file); }
if (failures.length) { console.error(`Potential committed secrets: ${failures.join(", ")}`); process.exitCode = 1; } else console.log("Secret scan OK");
