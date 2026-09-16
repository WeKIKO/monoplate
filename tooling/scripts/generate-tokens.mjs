#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ROOT, readJson } from "./lib/workspace.mjs";
import { buildDesignTokens, renderDesignTokenOutputs } from "./lib/design-tokens.mjs";

const tokenRoot = join(ROOT, "packages/design-tokens");
const source = await readJson(join(tokenRoot, "tokens.json"));
const tokens = buildDesignTokens(source);
const rendered = renderDesignTokenOutputs(tokens);
const outputs = new Map([
  [join(tokenRoot, "src/index.ts"), rendered.typescript],
  [join(tokenRoot, "generated/tailwind.cjs"), rendered.tailwind],
  [join(tokenRoot, "generated/theme.css"), rendered.css],
]);

const check = process.argv.includes("--check");
const stale = [];
for (const [path, expected] of outputs) {
  if (check) {
    const actual = await readFile(path, "utf8").catch(() => "");
    if (actual !== expected) stale.push(path.slice(ROOT.length + 1));
  } else await writeFile(path, expected);
}

if (stale.length) {
  console.error(`Generated design tokens are stale:\n${stale.map((path) => `- ${path}`).join("\n")}\nRun: pnpm tokens:generate`);
  process.exitCode = 1;
} else console.log(check ? "Design tokens are up to date" : `Generated ${outputs.size} design-token outputs`);
