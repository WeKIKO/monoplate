#!/usr/bin/env node
import { mkdir, readdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import process, { stdin, stdout } from "node:process";
import sharp from "sharp";
import { buildDesignTokens, normalizeHexColor, renderDesignTokenOutputs } from "./lib/design-tokens.mjs";

const skippedDirectories = new Set([".git", ".turbo", ".astro", ".expo", "node_modules", "dist", "coverage", "android", "ios"]);
const textExtensions = new Set([".astro", ".cjs", ".css", ".json", ".md", ".mjs", ".sh", ".svg", ".ts", ".tsx", ".yaml", ".yml"]);
const textFileNames = new Set(["Dockerfile", ".env.example"]);
const featureNames = ["admin", "sentry", "auth", "database", "eas", "observability"];

export function readArgs(argv) {
  const values = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument?.startsWith("--")) continue;
    const [key, inline] = argument.slice(2).split("=", 2);
    const following = argv[index + 1];
    if (inline !== undefined) values[key] = inline;
    else if (following && !following.startsWith("--")) { values[key] = following; index += 1; }
    else values[key] = "true";
  }
  return values;
}

const slugify = (value) => value.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "");
const normalizeNamespace = (value) => slugify(value.replace(/^@/, ""));
function validateIdentifier(value, label) { if (!value || !/^[a-z][a-z0-9-]*$/.test(value)) throw new Error(`${label} must start with a letter and contain only lowercase letters, numbers, and hyphens.`); return value; }
function parseFeature(value, name) { if (value === undefined || value === "true") return true; if (value === "false") return false; throw new Error(`--with-${name} must be true or false.`); }

async function renderSplashIcon(primary) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect x="48" y="48" width="184" height="184" rx="44" fill="${primary}"/>
  <rect x="280" y="48" width="184" height="184" rx="44" fill="${primary}" fill-opacity="0.72"/>
  <rect x="48" y="280" width="184" height="184" rx="44" fill="${primary}" fill-opacity="0.72"/>
  <rect x="280" y="280" width="184" height="184" rx="44" fill="${primary}"/>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

async function collectFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && skippedDirectories.has(entry.name)) continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(path));
    else if (textExtensions.has(extname(entry.name)) || textFileNames.has(entry.name)) files.push(path);
  }
  return files;
}

async function atomicWrite(path, content) {
  const temporary = `${path}.monoplate-tmp-${process.pid}`;
  await mkdir(dirname(path), { recursive: true });
  await writeFile(temporary, content);
  await rename(temporary, path);
}

async function commitChanges(changes) {
  const committed = [];
  try {
    for (const change of changes) {
      await atomicWrite(change.path, change.next);
      committed.push(change);
      if (process.env.MONOPLATE_TEST_FAIL_AFTER === String(committed.length)) throw new Error("Injected initializer failure");
    }
  } catch (error) {
    for (const change of committed.reverse()) {
      if (change.existed) await atomicWrite(change.path, change.original);
      else await rm(change.path, { force: true });
    }
    throw error;
  } finally {
    await Promise.all(changes.map((change) => rm(`${change.path}.monoplate-tmp-${process.pid}`, { force: true })));
  }
}

export async function initialize({ root, args, output = stdout }) {
  const project = validateIdentifier(slugify(args.name || basename(root) || "my-app"), "Project name");
  const namespace = validateIdentifier(normalizeNamespace(args.namespace || project), "Namespace");
  const displayName = (args.displayName || project).trim();
  const identifierBase = `${namespace.replace(/-/g, "")}.${project.replace(/-/g, "")}`;
  const iosBundleIdentifier = (args.iosBundleIdentifier || `com.${identifierBase}`).trim();
  const androidPackage = (args.androidPackage || `com.${identifierBase}`).trim();
  const tokenSourcePath = join(root, "packages/design-tokens/tokens.json");
  const tokenSource = await readFile(tokenSourcePath, "utf8").then(JSON.parse).catch(() => undefined);
  const primaryColor = normalizeHexColor(args.primaryColor || tokenSource?.primary || "#4F46E5");
  const selectedColors = {
    primary: primaryColor,
    ...(args.secondaryColor ? { secondary: normalizeHexColor(args.secondaryColor) } : tokenSource?.secondary ? { secondary: tokenSource.secondary } : {}),
    ...(args.tertiaryColor ? { tertiary: normalizeHexColor(args.tertiaryColor) } : tokenSource?.tertiary ? { tertiary: tokenSource.tertiary } : {}),
    ...(args.errorColor ? { error: normalizeHexColor(args.errorColor) } : tokenSource?.error ? { error: tokenSource.error } : {}),
  };
  const features = Object.fromEntries(featureNames.map((name) => [name, parseFeature(args[`with-${name}`], name)]));
  if (features.auth && !features.database) throw new Error("--with-auth=true requires --with-database=true.");
  const projectMetadata = { schemaVersion: 1, templateVersion: "0.1.0", project, namespace: `@${namespace}`, displayName, iosBundleIdentifier, androidPackage, theme: { ...selectedColors }, features };
  const metadataPath = join(root, ".monoplate/project.json");
  const existing = await readFile(metadataPath, "utf8").then(JSON.parse).catch(() => undefined);
  if (existing) {
    if (JSON.stringify(existing) === JSON.stringify(projectMetadata)) { output.write(`Already initialized ${displayName}; no changes required.\n`); return { changed: 0, metadata: projectMetadata }; }
    throw new Error("This workspace is already initialized with different values. Start from a clean template to change identity or feature options.");
  }

  const envPrefix = project.replace(/-/g, "_").toUpperCase();
  const databaseName = project.replace(/-/g, "_");
  const replacements = [
    ["@monoplate/", `@${namespace}/`], ['"name": "monoplate"', `"name": "${project}"`],
    ["Monoplate Admin", `${displayName} Admin`], ["Welcome to Monoplate", `Welcome to ${displayName}`],
    ["Monoplate에 오신 것을 환영합니다", `${displayName}에 오신 것을 환영합니다`], ["MONOPLATE_QUERY_CACHE", `${envPrefix}_QUERY_CACHE`],
    ["monoplate-api", `${project}-api`], ["monoplate_test", `${databaseName}_test`], [":5432/monoplate", `:5432/${databaseName}`], ["-d monoplate", `-d ${databaseName}`],
    ["POSTGRES_DB: monoplate", `POSTGRES_DB: ${databaseName}`], ['?? "Monoplate"', `?? "${displayName}"`], ['?? "monoplate"', `?? "${project}"`],
    ['"Monoplate API"', `"${displayName} API"`], ["monoplate_http", `${databaseName}_http`], ["monoplate-http", `${project}-http`],
    ['"monoplate.', `"${project}.`], ["<strong>Monoplate</strong>", `<strong>${displayName}</strong>`], ["<p>MONOPLATE</p>", `<p>${displayName.toUpperCase()}</p>`],
    [">Monoplate</text>", `>${displayName}</text>`], ['name: "Monoplate"', `name: "${displayName}"`], ['title: "Monoplate —', `title: "${displayName} —`],
    ["# Monoplate\n", `# ${displayName}\n`]
  ];
  const changes = [];
  const generatedTokenFiles = new Map();
  if (tokenSource) {
    const nextTokenSource = { ...tokenSource, ...selectedColors };
    const rendered = renderDesignTokenOutputs(buildDesignTokens(nextTokenSource));
    generatedTokenFiles.set(tokenSourcePath, `${JSON.stringify(nextTokenSource, null, 2)}\n`);
    generatedTokenFiles.set(join(root, "packages/design-tokens/src/index.ts"), rendered.typescript);
    generatedTokenFiles.set(join(root, "packages/design-tokens/generated/tailwind.cjs"), rendered.tailwind);
    generatedTokenFiles.set(join(root, "packages/design-tokens/generated/theme.css"), rendered.css);
  }
  for (const path of await collectFiles(root)) {
    const original = await readFile(path, "utf8");
    let next = generatedTokenFiles.get(path) ?? replacements.reduce((content, [from, to]) => content.split(from).join(to), original);
    if (path === join(root, "apps/mobile/app.config.ts")) next = next
      .replace(/bundleIdentifier: process\.env\.IOS_BUNDLE_IDENTIFIER \?\? "[^"]+"/, `bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER ?? "${iosBundleIdentifier}"`)
      .replace(/package: process\.env\.ANDROID_PACKAGE \?\? "[^"]+"/, `package: process.env.ANDROID_PACKAGE ?? "${androidPackage}"`);
    if (next !== original) changes.push({ path, original, next, existed: true });
  }
  const splashIconPath = join(root, "apps/mobile/assets/splash-icon.png");
  const originalSplashIcon = await readFile(splashIconPath).catch(() => undefined);
  changes.push({ path: splashIconPath, original: originalSplashIcon ?? Buffer.alloc(0), next: await renderSplashIcon(selectedColors.primary), existed: originalSplashIcon !== undefined });
  changes.push({ path: metadataPath, original: "", next: `${JSON.stringify(projectMetadata, null, 2)}\n`, existed: false });
  const provenancePath = join(root, ".monoplate/generated.json");
  const provenance = { generator: "monoplate", templateVersion: "0.1.0", generatedAt: new Date().toISOString(), editable: ["apps/**", "domains/**", "packages/**"], regenerate: ["apps/api/openapi.json", "packages/contracts/src/generated/**", "packages/design-tokens/src/generated/**"] };
  changes.push({ path: provenancePath, original: "", next: `${JSON.stringify(provenance, null, 2)}\n`, existed: false });
  await commitChanges(changes);
  output.write(`Initialized ${displayName}\nNamespace: @${namespace}\nUpdated files: ${changes.length}\n`);
  return { changed: changes.length, metadata: projectMetadata };
}

export async function promptForInitializerArgs({ args, root, prompt }) {
  if (!prompt) return args;
  if (!args.name) args.name = await prompt.question(`Project name (${slugify(basename(root)) || "my-app"}): `);
  if (!args.namespace) args.namespace = await prompt.question(`Package namespace (${args.name || basename(root)}): `);
  if (!args.displayName) args.displayName = await prompt.question(`App display name (${args.name || basename(root)}): `);
    const promptedProject = slugify(args.name || basename(root) || "my-app");
    const promptedNamespace = normalizeNamespace(args.namespace || promptedProject);
    const defaultApplicationId = `com.${promptedNamespace.replace(/-/g, "")}.${promptedProject.replace(/-/g, "")}`;
  if (!args.iosBundleIdentifier) args.iosBundleIdentifier = await prompt.question(`iOS bundle identifier (${defaultApplicationId}): `);
  if (!args.androidPackage) args.androidPackage = await prompt.question(`Android package name (${defaultApplicationId}): `);
  if (!args.primaryColor) args.primaryColor = await prompt.question("Primary color (#4F46E5): ");
  if (!args.secondaryColor) args.secondaryColor = await prompt.question("Secondary color (optional): ");
  if (!args.tertiaryColor) args.tertiaryColor = await prompt.question("Tertiary color (optional): ");
  if (!args.errorColor) args.errorColor = await prompt.question("Error color (optional): ");
  return args;
}

async function main() {
  const args = readArgs(process.argv.slice(2));
  const root = args.root ? resolve(args.root) : resolve(import.meta.dirname, "../..");
  const nonInteractive = args.yes === "true" || process.env.MONOPLATE_NON_INTERACTIVE === "1";
  const prompt = nonInteractive ? null : createInterface({ input: stdin, output: stdout });
  try {
    await promptForInitializerArgs({ args, root, prompt });
    await initialize({ root, args });
  } finally { prompt?.close(); }
}

if (resolve(process.argv[1] || "") === resolve(import.meta.filename)) await main();
