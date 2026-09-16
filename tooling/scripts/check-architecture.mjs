#!/usr/bin/env node
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { ROOT, importsOf, readJson, walkSourceFiles, workspacePath } from "./lib/workspace.mjs";

const config = await readJson(resolve(ROOT, process.argv[2] ?? "architecture-boundaries.json"));
if (config.version !== 1) throw new Error("Unsupported architecture boundary configuration");

const projectMetadataPath = join(ROOT, ".monoplate/project.json");
const namespace = existsSync(projectMetadataPath) ? (await readJson(projectMetadataPath)).namespace : "@monoplate";
const errors = [];

function packageRoot(specifier) {
  if (!specifier.startsWith(`${namespace}/`)) return null;
  return specifier.split("/").slice(0, 2).join("/");
}

async function workspacePackages() {
  const packages = new Map();
  for (const base of ["domains", "packages", "apps"]) {
    const root = join(ROOT, base);
    if (!existsSync(root)) continue;
    for (const entry of await readdir(root, { withFileTypes: true })) {
      const manifest = join(root, entry.name, "package.json");
      if (!entry.isDirectory() || !existsSync(manifest)) continue;
      const json = await readJson(manifest);
      packages.set(json.name, { root: join(root, entry.name), exports: Object.keys(json.exports ?? {}) });
    }
  }
  return packages;
}

const packages = await workspacePackages();
for (const [name, details] of packages) {
  if (details.root.startsWith(join(ROOT, config.domainRoot))) {
    const manifest = await readJson(join(details.root, "package.json"));
    for (const section of ["dependencies", "peerDependencies", "optionalDependencies"]) {
      for (const dependency of Object.keys(manifest[section] ?? {})) errors.push(`${workspacePath(join(details.root, "package.json"))}: domain package may not declare ${section}.${dependency}`);
    }
  }
  for (const file of await walkSourceFiles(details.root)) {
    const relativeFile = workspacePath(file);
    const normalized = relativeFile.split(sep).join("/");
    const source = await readFile(file, "utf8");
    for (const specifier of importsOf(source)) {
      if (specifier.startsWith("../")) errors.push(`${relativeFile}: parent-relative import ${specifier} is not allowed; use the package's # namespace`);
      const allowedImporters = config.restrictedImports?.[specifier];
      if (allowedImporters && !allowedImporters.includes(normalized)) {
        errors.push(`${relativeFile}: ${specifier} is infrastructure-specific and may only be imported by ${allowedImporters.join(", ")}`);
      }
      if ((normalized.includes("/domains/") || normalized.startsWith("domains/")) && normalized.includes("/src/") && !normalized.endsWith(".test.ts") && !normalized.endsWith(".test.tsx") && !specifier.startsWith(".") && !specifier.startsWith("#")) {
        errors.push(`${relativeFile}: domain production source may not import external package ${specifier}`);
      }
      const targetPackage = packageRoot(specifier);
      if (targetPackage && packages.has(targetPackage) && specifier !== targetPackage) {
        const subpath = `.${specifier.slice(targetPackage.length)}`;
        if (!packages.get(targetPackage).exports.includes(subpath)) errors.push(`${relativeFile}: non-exported deep import ${specifier}`);
      }

      if (normalized.includes("/domains/") || normalized.startsWith("domains/")) {
        const insideDomainLayer = normalized.includes("/src/domain/");
        const insideApplicationLayer = normalized.includes("/src/application/");
        if (insideDomainLayer && !specifier.startsWith(".") && config.domainForbiddenPackages.some((item) => specifier === item || specifier.startsWith(`${item}/`))) {
          errors.push(`${relativeFile}: domain layer may not import ${specifier}`);
        }
        if (insideApplicationLayer && normalized.includes("/adapters/")) errors.push(`${relativeFile}: application source cannot live under adapters`);
        if (insideApplicationLayer && specifier.includes("/adapters/")) errors.push(`${relativeFile}: application layer may not import adapter ${specifier}`);
      }

      if (config.clientRoots.some((clientRoot) => normalized.startsWith(`${clientRoot}/`)) && targetPackage) {
        const shortName = targetPackage.slice(namespace.length + 1);
        if (packages.get(targetPackage).root.startsWith(join(ROOT, config.domainRoot)) || config.serverOnlyPackages.includes(shortName)) {
          errors.push(`${relativeFile}: client application may not import server package ${specifier}`);
        }
      }
    }

    if (name.startsWith(`${namespace}/`) && normalized.includes("/src/domain/") && /process\.env|import\.meta\.env/.test(source)) {
      errors.push(`${relativeFile}: domain layer may not read environment variables`);
    }
  }
}

if (errors.length) {
  console.error("Architecture boundary violations:\n");
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log(`Architecture boundaries OK (${packages.size} workspace packages, namespace ${namespace})`);
}
