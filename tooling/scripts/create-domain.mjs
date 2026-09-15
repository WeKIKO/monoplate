#!/usr/bin/env node
import { existsSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { ROOT, readJson } from "./lib/workspace.mjs";
import { addWorkspaceDependency, camel, kebab, namespace, pascal, readArgs, refreshLockfile, regenerateContractIndex, regenerateDatabaseSchemaIndex, regenerateDomainModule, regenerateDomainPublic, regenerateModuleIndex, writeJson, writeNew } from "./lib/scaffolding.mjs";

const args = readArgs(process.argv.slice(2));
const name = kebab(args.name, "Domain name");
const entity = pascal(args.entity ?? name);
const scope = await namespace();
const root = join(ROOT, "domains", name);

if (existsSync(root)) throw new Error(`Domain already exists: domains/${name}`);

await writeJson(join(root, "domain.json"), { name, entity, kind: "domain", defaultEnabled: true, description: args.description ?? `${entity} bounded context` });
await writeJson(join(root, "package.json"), {
  name: `${scope}/${name}`,
  version: "0.1.0",
  private: true,
  type: "module",
  exports: { ".": "./src/public.ts" },
  scripts: { typecheck: "tsc", test: "vitest run", lint: "eslint src" },
  devDependencies: { [`${scope}/typescript-config`]: "workspace:*", typescript: "catalog:", vitest: "^3.0.0" },
});
await writeNew(join(root, "tsconfig.json"), `{"extends":"${scope}/typescript-config/base","include":["src"]}`);
await writeNew(join(root, `src/domain/${name}.ts`), `export type ${entity} = Readonly<{ id: string; name: string }>;`);
await writeNew(join(root, `src/application/ports/${name}-repository.ts`), `import type { ${entity} } from "../../domain/${name}.js";\n\nexport interface ${entity}Repository {\n  list(limit: number): Promise<readonly ${entity}[]>;\n  create(input: Readonly<{ name: string }>): Promise<${entity}>;\n  update(id: string, input: Readonly<{ name: string }>): Promise<${entity} | null>;\n  remove(id: string): Promise<boolean>;\n}`);
await writeNew(join(root, "src/application/list.ts"), `import type { ${entity}Repository } from "./ports/${name}-repository.js";\n\nexport function createList${entity}(repository: ${entity}Repository) {\n  return (limit: number) => repository.list(limit);\n}`);
await writeNew(join(root, "src/application/list.test.ts"), `import { describe, expect, it } from "vitest";\nimport type { ${entity}Repository } from "./ports/${name}-repository.js";\nimport { createList${entity} } from "./list.js";\n\ndescribe("createList${entity}", () => {\n  it("delegates to the repository port", async () => {\n    const repository: ${entity}Repository = {\n      list: async () => [{ id: "1", name: "Example" }],\n      create: async (input) => ({ id: "1", ...input }),\n      update: async (id, input) => ({ id, ...input }),\n      remove: async () => true,\n    };\n    await expect(createList${entity}(repository)(20)).resolves.toEqual([{ id: "1", name: "Example" }]);\n  });\n});`);

await writeNew(join(ROOT, `packages/contracts/src/${name}/model.ts`), `import { z } from "zod";\n\nexport const ${entity}Schema = z.object({ id: z.string(), name: z.string() });\nexport type ${entity}Dto = z.infer<typeof ${entity}Schema>;`);
const contractsManifestPath = join(ROOT, "packages/contracts/package.json");
const contractsManifest = await readJson(contractsManifestPath);
contractsManifest.exports[`./${name}/model`] = `./src/${name}/model.ts`;
contractsManifest.exports = Object.fromEntries(Object.entries(contractsManifest.exports).sort(([a], [b]) => a.localeCompare(b)));
await writeJson(contractsManifestPath, contractsManifest);
await writeNew(join(ROOT, `packages/database/src/schema/${name}.ts`), `import { pgTable, serial, text } from "drizzle-orm/pg-core";\n\nexport const ${camel(name)}Table = pgTable("${name.replaceAll("-", "_")}", {\n  id: serial("id").primaryKey(),\n  name: text("name").notNull(),\n});`);
const databaseManifestPath = join(ROOT, "packages/database/package.json");
const databaseManifest = await readJson(databaseManifestPath);
databaseManifest.exports[`./schema/${name}`] = `./src/schema/${name}.ts`;
databaseManifest.exports = Object.fromEntries(Object.entries(databaseManifest.exports).sort(([a], [b]) => a.localeCompare(b)));
await writeJson(databaseManifestPath, databaseManifest);
await regenerateDatabaseSchemaIndex();
await mkdir(join(ROOT, `apps/api/src/modules/${name}/http`), { recursive: true });
await writeNew(join(ROOT, `apps/api/src/modules/${name}/infrastructure/in-memory-${name}-repository.ts`), `import type { ${entity}, ${entity}Repository } from "${scope}/${name}";\n\nexport class InMemory${entity}Repository implements ${entity}Repository {\n  readonly #items = new Map<string, ${entity}>();\n  #sequence = 0;\n\n  async list(limit: number) { return [...this.#items.values()].slice(0, limit); }\n  async create(input: Readonly<{ name: string }>) {\n    const item = { id: String(++this.#sequence), name: input.name };\n    this.#items.set(item.id, item);\n    return item;\n  }\n  async update(id: string, input: Readonly<{ name: string }>) {\n    if (!this.#items.has(id)) return null;\n    const item = { id, name: input.name };\n    this.#items.set(id, item);\n    return item;\n  }\n  async remove(id: string) { return this.#items.delete(id); }\n}`);
await writeNew(join(ROOT, `apps/api/src/modules/${name}/infrastructure/drizzle-${name}-repository.ts`), `import type { ${entity}Repository } from "${scope}/${name}";\nimport type { Database } from "${scope}/database";\nimport { ${camel(name)}Table } from "${scope}/database/schema/${name}";\nimport { eq } from "drizzle-orm";\n\nexport class Drizzle${entity}Repository implements ${entity}Repository {\n  constructor(private readonly database: Database) {}\n\n  async list(limit: number) {\n    const rows = await this.database.select().from(${camel(name)}Table).limit(limit);\n    return rows.map((row) => ({ id: String(row.id), name: row.name }));\n  }\n  async create(input: Readonly<{ name: string }>) {\n    const [row] = await this.database.insert(${camel(name)}Table).values(input).returning();\n    if (!row) throw new Error("Insert did not return a row");\n    return { id: String(row.id), name: row.name };\n  }\n  async update(id: string, input: Readonly<{ name: string }>) {\n    const [row] = await this.database.update(${camel(name)}Table).set(input).where(eq(${camel(name)}Table.id, Number(id))).returning();\n    return row ? { id: String(row.id), name: row.name } : null;\n  }\n  async remove(id: string) {\n    const rows = await this.database.delete(${camel(name)}Table).where(eq(${camel(name)}Table.id, Number(id))).returning({ id: ${camel(name)}Table.id });\n    return rows.length > 0;\n  }\n}`);

await regenerateDomainPublic(name);
await regenerateContractIndex();
await regenerateDomainModule(name);
await regenerateModuleIndex();
await addWorkspaceDependency(`${scope}/${name}`);
refreshLockfile(args["skip-install"] === "true");
console.log(`Created domain ${scope}/${name}. Next: pnpm generate:route -- --domain ${name} --name list-${name} --method get`);
