#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { ROOT, readJson } from "./lib/workspace.mjs";

export async function readAvailableDomains() {
  const root = join(ROOT, "domains");
  if (!existsSync(root)) return [];
  const domains = [];
  for (const entry of await readdir(root, { withFileTypes: true })) {
    const manifest = join(root, entry.name, "domain.json");
    if (!entry.isDirectory() || !existsSync(manifest)) continue;
    const domain = await readJson(manifest);
    if (domain.kind === "domain" && typeof domain.name === "string") domains.push(domain);
  }
  return domains.sort((left, right) => left.name.localeCompare(right.name));
}

const domains = await readAvailableDomains();
if (process.argv.includes("--json")) console.log(JSON.stringify(domains, null, 2));
else if (process.argv.includes("--list") || process.argv.includes("-l")) domains.forEach((domain, index) => console.log(`${String(index + 1).padStart(2, " ")}. ${domain.name}${domain.description ? ` — ${domain.description}` : ""}`));
else console.log(domains.map((domain) => domain.name).join(","));
