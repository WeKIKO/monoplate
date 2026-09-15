#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
const url = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL;
const target = process.env.BACKUP_FILE;
if (!url || !target) throw new Error("DATABASE_URL_UNPOOLED (or DATABASE_URL) and BACKUP_FILE are required");
const result = spawnSync("pg_dump", ["--format=custom", "--no-owner", "--no-acl", "--file", resolve(target), url], { stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
