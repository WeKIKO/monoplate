import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { AuthService } from "./modules/auth/auth-service.js";
import { noopLogger } from "@monoplate/logger";
import { createApp } from "./app.js";

const unavailable = async () => { throw new Error("Documentation-only dependency"); };
const auth = { login: unavailable, refresh: unavailable, logout: unavailable, identity: unavailable, requirePermission: () => undefined } as unknown as AuthService;
const response = await createApp(noopLogger, undefined, auth).request("/openapi.json");
const output = `${JSON.stringify(await response.json(), null, 2)}\n`;
const path = resolve(process.cwd(), "openapi.json");
if (process.argv.includes("--check")) { if (await readFile(path, "utf8") !== output) throw new Error("OpenAPI document is stale. Run: pnpm api:openapi:generate"); }
else { await mkdir(resolve(path, ".."), { recursive: true }); await writeFile(path, output); }
