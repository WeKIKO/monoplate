import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { spawnSync } from "node:child_process";
import { ROOT, readJson } from "./workspace.mjs";

export function readArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value?.startsWith("--")) continue;
    const [key, inline] = value.slice(2).split("=", 2);
    const next = argv[index + 1];
    if (inline !== undefined) args[key] = inline;
    else if (next && !next.startsWith("--")) { args[key] = next; index += 1; }
    else args[key] = "true";
  }
  return args;
}

export function kebab(value, label = "Name") {
  const result = String(value ?? "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!/^[a-z][a-z0-9-]*$/.test(result)) throw new Error(`${label} must start with a letter and contain letters, numbers, or hyphens.`);
  return result;
}

export function pascal(value) {
  return kebab(value).split("-").map((part) => part[0].toUpperCase() + part.slice(1)).join("");
}

export function camel(value) {
  const name = pascal(value);
  return name[0].toLowerCase() + name.slice(1);
}

export async function namespace() {
  const metadata = join(ROOT, ".monoplate/project.json");
  if (existsSync(metadata)) return (await readJson(metadata)).namespace;
  const api = await readJson(join(ROOT, "apps/api/package.json"));
  return api.name.split("/")[0];
}

export async function writeNew(path, content) {
  if (existsSync(path)) throw new Error(`Refusing to overwrite existing file: ${path.slice(ROOT.length + 1)}`);
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, content.endsWith("\n") ? content : `${content}\n`);
}

export async function writeJson(path, value) {
  await mkdir(join(path, ".."), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function directories(path) {
  if (!existsSync(path)) return [];
  return (await readdir(path, { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort();
}

export async function regenerateModuleIndex() {
  const names = (await directories(join(ROOT, "apps/api/src/modules"))).filter((name) => existsSync(join(ROOT, "apps/api/src/modules", name, "module.ts")));
  const imports = names.map((name) => `import { create${pascal(name)}Module } from "./${name}/module.js";`).join("\n");
  const modules = names.map((name) => `create${pascal(name)}Module`).join(", ");
  await writeFile(join(ROOT, "apps/api/src/modules/index.ts"), `${imports}\nimport type { OpenAPIHono } from "@hono/zod-openapi";\nimport type { ApiDependencies, ApiModuleFactory } from "./types.js";\n\nexport const apiModuleFactories: readonly ApiModuleFactory[] = [${modules}];\n\nexport function registerApiModules(app: OpenAPIHono, dependencies: ApiDependencies) {\n  for (const factory of apiModuleFactories) app.route("/", factory(dependencies).routes);\n}\n`);
}

export async function regenerateDomainPublic(domain) {
  const root = join(ROOT, "domains", domain, "src");
  const manifest = await readJson(join(ROOT, "domains", domain, "domain.json"));
  const entity = manifest.entity ?? pascal(domain);
  const application = existsSync(join(root, "application"))
    ? (await readdir(join(root, "application"))).filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts")).sort()
    : [];
  const lines = [
    `export type { ${entity} } from "./domain/${domain}.js";`,
    `export type { ${entity}Repository } from "./application/ports/${domain}-repository.js";`,
    ...application.map((file) => `export * from "./application/${file.replace(/\.ts$/, ".js")}";`),
  ];
  await writeFile(join(root, "public.ts"), `${lines.join("\n")}\n`);
}

export async function regenerateContractIndex() {
  const src = join(ROOT, "packages/contracts/src");
  const files = (await readdir(src)).filter((file) => file.endsWith(".ts") && file !== "index.ts").sort();
  await writeFile(join(src, "index.ts"), `${files.map((file) => `export * from "./${file.replace(/\.ts$/, ".js")}";`).join("\n")}\n`);
}

export async function regenerateDatabaseSchemaIndex() {
  const root = join(ROOT, "packages/database/src/schema");
  const files = (await readdir(root)).filter((file) => file.endsWith(".ts") && file !== "index.ts").sort();
  await writeFile(join(root, "index.ts"), `${files.map((file) => `export * from "./${file.replace(/\.ts$/, ".js")}";`).join("\n")}\n`);
}

export async function regenerateDomainModule(domain) {
  const moduleRoot = join(ROOT, "apps/api/src/modules", domain);
  const routeRoot = join(moduleRoot, "http");
  const routeFiles = existsSync(routeRoot) ? (await readdir(routeRoot)).filter((file) => file.endsWith(".route.ts")).sort() : [];
  const routeImports = routeFiles.map((file) => {
    const name = file.replace(/\.route\.ts$/, "");
    return `import { create${pascal(name)}Route } from "./http/${name}.route.js";`;
  }).join("\n");
  const manifest = await readJson(join(ROOT, "domains", domain, "domain.json"));
  const entity = manifest.entity ?? pascal(domain);
  const adapterImports = `import { Drizzle${entity}Repository } from "./infrastructure/drizzle-${domain}-repository.js";\nimport { InMemory${entity}Repository } from "./infrastructure/in-memory-${domain}-repository.js";`;
  const registrations = routeFiles.map((file) => `routes.route("/", create${pascal(file.replace(/\.route\.ts$/, ""))}Route(repository));`).join("\n");
  await writeFile(join(moduleRoot, "module.ts"), `import { createApiRouter } from "../../http/route-factory.js";\nimport type { ApiModuleFactory } from "../types.js";\n${adapterImports}\n${routeImports}${routeImports ? "\n" : ""}\nexport const create${pascal(domain)}Module: ApiModuleFactory = (dependencies) => {\n  const repository = dependencies.database\n    ? new Drizzle${entity}Repository(dependencies.database)\n    : new InMemory${entity}Repository();\n  const routes = createApiRouter();\n  ${registrations.replaceAll("\n", "\n  ")}\n  return { name: "${domain}", routes };\n};\n`);
}

export async function addWorkspaceDependency(packageName) {
  const path = join(ROOT, "apps/api/package.json");
  const manifest = await readJson(path);
  manifest.dependencies = Object.fromEntries(Object.entries({ ...manifest.dependencies, [packageName]: "workspace:*" }).sort(([a], [b]) => a.localeCompare(b)));
  await writeJson(path, manifest);
}

export function refreshLockfile(skipInstall = false) {
  if (skipInstall) return;
  const result = spawnSync("pnpm", ["install", "--lockfile-only"], { cwd: ROOT, stdio: "inherit" });
  if (result.status !== 0) throw new Error("pnpm failed to refresh the lockfile");
}
