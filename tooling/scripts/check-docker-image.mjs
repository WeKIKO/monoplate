#!/usr/bin/env node
import { spawnSync } from "node:child_process";

const image = process.env.API_IMAGE ?? "monoplate-api";
const container = `monoplate-smoke-${process.pid}`;
const port = 43000 + (process.pid % 1000);
const run = (args, inherit = false) => spawnSync("docker", args, { encoding: "utf8", stdio: inherit ? "inherit" : "pipe" });

if (run(["info"]).status !== 0) {
  console.error("Docker daemon is unavailable");
  process.exit(2);
}

const started = run(["run", "--detach", "--rm", "--name", container, "--publish", `${port}:3000`, image]);
if (started.status !== 0) {
  console.error(started.stderr || `Unable to start image ${image}`);
  process.exit(1);
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));
let healthy = false;
try {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health/ready`);
      if (response.ok) { healthy = true; break; }
    } catch {}
    await delay(250);
  }
  if (!healthy) {
    const logs = run(["logs", container]);
    throw new Error(`Container did not become ready\n${logs.stdout}\n${logs.stderr}`);
  }
  const stopped = run(["stop", "--time", "5", container]);
  if (stopped.status !== 0) throw new Error(stopped.stderr || "Container shutdown failed");
  console.log(`Docker image OK (${image})`);
} catch (error) {
  run(["rm", "--force", container]);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
