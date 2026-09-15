#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { ROOT } from "./lib/workspace.mjs";

const entry = join(ROOT, "apps/api/dist/server.cjs");
if (!existsSync(entry)) {
  console.error("API bundle is missing. Run: pnpm --filter @monoplate/api build");
  process.exit(2);
}

const port = 42000 + (process.pid % 1000);
const child = spawn(process.execPath, [entry], { cwd: ROOT, env: { ...process.env, NODE_ENV: "test", PORT: String(port), LOG_LEVEL: "silent" }, stdio: ["ignore", "pipe", "pipe"] });
let output = "";
child.stdout.on("data", (chunk) => { output += chunk; });
child.stderr.on("data", (chunk) => { output += chunk; });

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function waitForHealth(path) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) throw new Error(`API exited before readiness\n${output}`);
    try {
      const response = await fetch(`http://127.0.0.1:${port}${path}`);
      if (response.ok) return;
    } catch {}
    await delay(100);
  }
  throw new Error(`Timed out waiting for ${path}\n${output}`);
}

try {
  await waitForHealth("/health/live");
  await waitForHealth("/health/ready");
  child.kill("SIGTERM");
  const exit = await Promise.race([
    new Promise((resolve) => child.once("exit", (code, signal) => resolve({ code, signal }))),
    delay(5000).then(() => null),
  ]);
  if (!exit) { child.kill("SIGKILL"); throw new Error("API did not stop within 5 seconds after SIGTERM"); }
  if (exit.code !== 0) throw new Error(`API shutdown was not clean: ${JSON.stringify(exit)}\n${output}`);
  console.log("API bundle OK (live, ready, graceful shutdown)");
} catch (error) {
  child.kill("SIGKILL");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
