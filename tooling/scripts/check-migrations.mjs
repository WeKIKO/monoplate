#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { ROOT } from "./lib/workspace.mjs";
const directory = join(ROOT, "packages/database/migrations");
const files = (await readdir(directory)).filter((file) => file.endsWith(".sql")).sort();
const destructive = [/\bdrop\s+(?:table|schema|column|type)\b/i, /\btruncate\b/i, /\balter\s+table[\s\S]*\bdrop\b/i];
const failures = [];
for (const file of files) { const sql = await readFile(join(directory, file), "utf8"); if (!sql.includes("monoplate:allow-destructive") && destructive.some((pattern) => pattern.test(sql))) failures.push(file); }
if (failures.length) { console.error(`Destructive migrations require a '-- monoplate:allow-destructive <reason>' marker: ${failures.join(", ")}`); process.exitCode = 1; } else console.log(`Migration safety OK (${files.length} migrations)`);
