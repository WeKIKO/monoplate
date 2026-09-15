#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const url = process.env.DATABASE_URL;
const source = process.env.BACKUP_FILE;
if (!url || !source) throw new Error("DATABASE_URL and BACKUP_FILE are required");
const database = new URL(url).pathname.slice(1);
if (!database.endsWith("_test")) throw new Error(`Refusing restore verification against non-test database: ${database}`);
const result = spawnSync("pg_restore", ["--clean", "--if-exists", "--no-owner", "--no-acl", "--dbname", url, resolve(source)], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
