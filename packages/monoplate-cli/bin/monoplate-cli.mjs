#!/usr/bin/env node
/* global console, process */
import { spawnSync } from "node:child_process";
import { existsSync, lstatSync, readFileSync, rmSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const CLI_NAME = "@xierra/monoplate-cli";
export const DEFAULT_TEMPLATE = "https://github.com/WeKIKO/monoplate.git";

export const HELP = `
${CLI_NAME} — Monoplate application scaffolding

Usage:
  npx ${CLI_NAME}@latest new <project-name> [options]

Identity and theme:
  --namespace=<name>                 workspace namespace without @
  --display-name=<name>              application display name
  --primary-color=<#RRGGBB>          Material 3 theme seed (default: #4F46E5)
  --secondary-color=<#RRGGBB>        optional secondary seed
  --tertiary-color=<#RRGGBB>         optional tertiary seed
  --error-color=<#RRGGBB>            optional error seed
  --ios-bundle-identifier=<id>        iOS bundle identifier
  --android-package=<id>              Android application id
  --ios-bundle-name=<id>              alias of --ios-bundle-identifier
  --android-package-name=<id>          alias of --android-package

Template:
  --template=<git-url>                template repository (default: ${DEFAULT_TEMPLATE})
  --tag=<tag-or-branch>               template tag or branch
  --skip-install                      clone only; requires --skip-init
  --skip-init                         do not run the template initializer
  --yes                               use initializer defaults without prompts
  --keep-on-failure                   keep a partially created directory for debugging
  --help                              show this help

Examples:
  npx ${CLI_NAME}@latest new happy
  npx ${CLI_NAME}@latest new happy --namespace=happy --primary-color=#FF6B35
  npx ${CLI_NAME}@latest new happy --tag=v0.2.0
`.trim();

export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === "--") { positional.push(...argv.slice(index + 1)); break; }
    if (argument.startsWith("--")) {
      const separator = argument.indexOf("=");
      const key = argument.slice(2, separator === -1 ? undefined : separator);
      if (!key) throw new Error("Invalid empty option.");
      if (separator !== -1) flags[key] = argument.slice(separator + 1);
      else if (argv[index + 1] && !argv[index + 1].startsWith("-")) flags[key] = argv[++index];
      else flags[key] = "true";
    } else if (argument === "-h") flags.help = "true";
    else if (argument === "-v") flags.version = "true";
    else if (argument.startsWith("-")) throw new Error(`Unknown short option: ${argument}`);
    else positional.push(argument);
  }
  return { positional, flags };
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { cwd: options.cwd, env: options.env, stdio: options.capture ? "pipe" : "inherit", encoding: "utf8" });
  if (result.error) throw new Error(`Unable to run ${command}: ${result.error.message}`);
  if (result.status !== 0) throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status ?? "unknown"}`);
  return result.stdout?.trim() ?? "";
}

function assertCommand(command, installHint) {
  const result = spawnSync(command, ["--version"], { stdio: "ignore" });
  if (result.status !== 0) throw new Error(`${command} is required. ${installHint}`);
}

function isInside(target, candidate) {
  const path = relative(target, candidate);
  return path === "" || (!path.startsWith(`..${sep}`) && path !== ".." && !isAbsolute(path));
}

export function applyTemplateIgnore(target) {
  const ignoreFile = resolve(target, ".template-ignore");
  if (!existsSync(ignoreFile)) return [];
  const removed = [];
  const entries = readFileSync(ignoreFile, "utf8").split(/\r?\n/).map((line) => line.trim()).filter((line) => line && !line.startsWith("#"));
  for (const entry of entries) {
    const candidate = resolve(target, entry);
    if (!isInside(target, candidate) || candidate === target) throw new Error(`Unsafe .template-ignore entry: ${entry}`);
    try { lstatSync(candidate); }
    catch { continue; }
    rmSync(candidate, { recursive: true, force: true });
    removed.push(entry);
  }
  rmSync(ignoreFile, { force: true });
  return removed;
}

const initializerFlags = new Map([
  ["namespace", "namespace"], ["display-name", "displayName"], ["primary-color", "primaryColor"], ["secondary-color", "secondaryColor"],
  ["tertiary-color", "tertiaryColor"], ["error-color", "errorColor"],
  ["ios-bundle-identifier", "iosBundleIdentifier"], ["android-package", "androidPackage"],
  ["with-admin", "with-admin"], ["with-sentry", "with-sentry"], ["with-auth", "with-auth"],
  ["with-database", "with-database"], ["with-eas", "with-eas"], ["with-observability", "with-observability"],
]);

export function buildInitializerArgs(name, flags) {
  const normalizedFlags = {
    ...flags,
    "ios-bundle-identifier": flags["ios-bundle-identifier"] ?? flags["ios-bundle-name"],
    "android-package": flags["android-package"] ?? flags["android-package-name"],
  };
  const args = ["run", "init", "--", `--name=${name}`];
  for (const [cliName, initializerName] of initializerFlags) {
    if (normalizedFlags[cliName] !== undefined) args.push(`--${initializerName}=${normalizedFlags[cliName]}`);
  }
  if (flags.yes === "true") args.push("--yes");
  return args;
}

export function createProject({ name, flags, cwd = process.cwd(), log = console.log }) {
  if (!/^[a-z][a-z0-9-]*$/.test(name ?? "")) throw new Error("Project name must start with a letter and contain only lowercase letters, numbers, and hyphens.");
  if (flags["skip-install"] === "true" && flags["skip-init"] !== "true") throw new Error("--skip-install requires --skip-init because the initializer uses installed tooling dependencies.");
  const target = resolve(cwd, name);
  if (existsSync(target)) throw new Error(`Target already exists: ${target}`);
  assertCommand("git", "Install Git from https://git-scm.com.");
  if (flags["skip-install"] !== "true") assertCommand("pnpm", "Install pnpm with corepack enable pnpm.");
  const cloneArgs = ["clone", "--depth", "1"];
  if (flags.tag) cloneArgs.push("--branch", flags.tag);
  cloneArgs.push(flags.template || DEFAULT_TEMPLATE, target);
  let created = false;
  try {
    log(`Cloning Monoplate${flags.tag ? ` (${flags.tag})` : ""} into ${name}...`);
    run("git", cloneArgs, { cwd });
    created = true;
    rmSync(resolve(target, ".git"), { recursive: true, force: true });
    run("git", ["init", "--quiet"], { cwd: target });
    applyTemplateIgnore(target);
    if (flags["skip-install"] !== "true") {
      log("Installing dependencies...");
      run("pnpm", ["install", "--frozen-lockfile"], { cwd: target });
    }
    if (flags["skip-init"] !== "true") {
      log("Configuring project identity and theme...");
      run("pnpm", buildInitializerArgs(name, flags), { cwd: target, env: { ...process.env, ...(flags.yes === "true" ? { MONOPLATE_NON_INTERACTIVE: "1" } : {}) } });
      log("Refreshing workspace links...");
      run("pnpm", ["install", "--frozen-lockfile"], { cwd: target });
    }
    log(`Created ${name}. Next: cd ${name} && pnpm dev`);
    return target;
  } catch (error) {
    if (created && flags["keep-on-failure"] !== "true") rmSync(target, { recursive: true, force: true });
    throw error;
  }
}

export function main(argv = process.argv.slice(2)) {
  try {
    const { positional, flags } = parseArgs(argv);
    if (flags.help === "true" || positional[0] === "help" || positional.length === 0) { console.log(HELP); return; }
    if (flags.version === "true") { console.log("Run `npm view @xierra/monoplate-cli version`."); return; }
    const [command, name, ...extra] = positional;
    if (command !== "new") throw new Error(`Unknown command: ${command}`);
    if (!name || extra.length) throw new Error(`Usage: npx ${CLI_NAME}@latest new <project-name> [options]`);
    createProject({ name, flags });
  } catch (error) {
    console.error(`monoplate: ${error instanceof Error ? error.message : String(error)}`);
    process.exitCode = 1;
  }
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : "";
if (invokedPath === resolve(fileURLToPath(import.meta.url))) main();
