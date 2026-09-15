#!/usr/bin/env node
import { existsSync } from "node:fs";
import { join } from "node:path";
import { ROOT, readJson } from "./lib/workspace.mjs";
import { camel, kebab, namespace, pascal, readArgs, regenerateContractIndex, regenerateDomainModule, regenerateDomainPublic, writeJson, writeNew } from "./lib/scaffolding.mjs";

const args = readArgs(process.argv.slice(2));
const domain = kebab(args.domain, "Domain name");
const name = kebab(args.name, "Route name");
const method = String(args.method ?? "get").toLowerCase();
if (!new Set(["get", "post", "put", "patch", "delete"]).has(method)) throw new Error("Method must be get, post, put, patch, or delete.");

const domainRoot = join(ROOT, "domains", domain);
if (!existsSync(domainRoot)) throw new Error(`Unknown domain: ${domain}. Run generate:domain first.`);
const manifest = await readJson(join(domainRoot, "domain.json"));
if (!manifest.entity) throw new Error(`Domain ${domain} predates route generation and has no entity field in domain.json.`);
const entity = manifest.entity;
const routeName = pascal(name);
const scope = await namespace();
const hasId = method === "put" || method === "patch" || method === "delete";
const defaultPath = `/api/v1/${domain}${hasId ? "/{id}" : ""}`;
const path = String(args.path ?? defaultPath).replace(/:([A-Za-z][A-Za-z0-9_]*)/g, "{$1}");
if (!path.startsWith("/")) throw new Error("Route path must start with '/'.");
if (hasId && !path.includes("{id}")) throw new Error(`${method.toUpperCase()} routes require an {id} path parameter.`);

const operationPath = join(domainRoot, `src/application/${name}.ts`);
const operationTestPath = join(domainRoot, `src/application/${name}.test.ts`);
const contractPath = join(ROOT, `packages/contracts/src/${domain}/${name}.ts`);
const routePath = join(ROOT, `apps/api/src/modules/${domain}/http/${name}.route.ts`);
const routeTestPath = join(ROOT, `apps/api/src/modules/${domain}/http/${name}.route.test.ts`);
for (const candidate of [operationPath, operationTestPath, contractPath, routePath, routeTestPath]) {
  if (existsSync(candidate)) throw new Error(`Route already exists or conflicts with: ${candidate.slice(ROOT.length + 1)}`);
}

const operation = method === "get"
  ? `import type { ${entity}Repository } from "./ports/${domain}-repository.js";\n\nexport function create${routeName}(repository: ${entity}Repository) {\n  return (input: Readonly<{ limit: number }>) => repository.list(input.limit);\n}`
  : method === "post"
    ? `import type { ${entity}Repository } from "./ports/${domain}-repository.js";\n\nexport function create${routeName}(repository: ${entity}Repository) {\n  return (input: Readonly<{ name: string }>) => repository.create(input);\n}`
    : method === "delete"
      ? `import type { ${entity}Repository } from "./ports/${domain}-repository.js";\n\nexport function create${routeName}(repository: ${entity}Repository) {\n  return (input: Readonly<{ id: string }>) => repository.remove(input.id);\n}`
      : `import type { ${entity}Repository } from "./ports/${domain}-repository.js";\n\nexport function create${routeName}(repository: ${entity}Repository) {\n  return (input: Readonly<{ id: string; name: string }>) => repository.update(input.id, { name: input.name });\n}`;

const requestSchema = method === "get"
  ? `export const ${routeName}RequestSchema = z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) });`
  : method === "post"
    ? `export const ${routeName}RequestSchema = z.object({ name: z.string().trim().min(1).max(120) });`
    : method === "delete"
      ? `export const ${routeName}RequestSchema = z.object({ id: z.string().min(1) });`
      : `export const ${routeName}ParamsSchema = z.object({ id: z.string().min(1) });\nexport const ${routeName}RequestSchema = z.object({ name: z.string().trim().min(1).max(120) });`;
const responseSchema = method === "get"
  ? `z.object({ data: z.array(${entity}Schema) })`
  : method === "delete"
    ? `z.object({ data: z.object({ deleted: z.boolean() }) })`
    : `z.object({ data: ${entity}Schema })`;

await writeNew(operationPath, operation);
await writeNew(operationTestPath, `import { describe, expect, it } from "vitest";\nimport type { ${entity}Repository } from "./ports/${domain}-repository.js";\nimport { create${routeName} } from "./${name}.js";\n\ndescribe("create${routeName}", () => {\n  it("uses the repository port", async () => {\n    const repository: ${entity}Repository = {\n      list: async () => [{ id: "1", name: "Example" }],\n      create: async (input) => ({ id: "1", ...input }),\n      update: async (id, input) => ({ id, ...input }),\n      remove: async () => true,\n    };\n    ${method === "get" ? `await expect(create${routeName}(repository)({ limit: 20 })).resolves.toHaveLength(1);` : method === "post" ? `await expect(create${routeName}(repository)({ name: "Example" })).resolves.toEqual({ id: "1", name: "Example" });` : method === "delete" ? `await expect(create${routeName}(repository)({ id: "1" })).resolves.toBe(true);` : `await expect(create${routeName}(repository)({ id: "1", name: "Updated" })).resolves.toEqual({ id: "1", name: "Updated" });`}\n  });\n});`);
await writeNew(contractPath, `import { z } from "zod";\n${method === "delete" ? "" : `import { ${entity}Schema } from "./model.js";\n`}\n${requestSchema}\nexport const ${routeName}ResponseSchema = ${responseSchema};\nexport type ${routeName}Request = z.infer<typeof ${routeName}RequestSchema>;\nexport type ${routeName}Response = z.infer<typeof ${routeName}ResponseSchema>;`);

const requestDefinition = method === "get"
  ? `request: { query: ${routeName}RequestSchema },`
  : method === "post"
    ? `request: { headers: JsonContentTypeHeaderSchema, body: { required: true, content: { "application/json": { schema: ${routeName}RequestSchema } } } },`
    : method === "delete"
      ? `request: { params: ${routeName}RequestSchema },`
      : `request: { headers: JsonContentTypeHeaderSchema, params: ${routeName}ParamsSchema, body: { required: true, content: { "application/json": { schema: ${routeName}RequestSchema } } } },`;
const validatedInput = method === "get" ? `context.req.valid("query")` : method === "post" ? `context.req.valid("json")` : method === "delete" ? `context.req.valid("param")` : `{ ...context.req.valid("param"), ...context.req.valid("json") }`;
const successValue = method === "delete" ? `{ data: { deleted: result } }` : `{ data: result }`;
const nullableGuard = method === "put" || method === "patch" ? `\n    if (!result) throw new AppError("NOT_FOUND", "${entity} not found");` : "";
const extraContractImport = method === "put" || method === "patch" ? `, ${routeName}ParamsSchema` : "";
const contentTypeImport = method !== "get" && method !== "delete" ? `import { JsonContentTypeHeaderSchema } from "${scope}/contracts/http";\n` : "";

await writeNew(routePath, `import { ${routeName}RequestSchema, ${routeName}ResponseSchema${extraContractImport} } from "${scope}/contracts/${domain}/${name}";\n${contentTypeImport}import { create${routeName}, type ${entity}Repository } from "${scope}/${domain}";\n${nullableGuard ? `import { AppError } from "${scope}/errors";\n` : ""}import { createApiRouter, createRoute, jsonContent, standardErrorResponses } from "../../../http/route-factory.js";\n\nconst definition = createRoute({\n  method: "${method}",\n  path: "${path}",\n  tags: ["${domain}"],\n  summary: "${routeName}",\n  ${requestDefinition}\n  responses: { 200: jsonContent(${routeName}ResponseSchema, "Successful response"), ...standardErrorResponses },\n});\n\nexport function create${routeName}Route(repository: ${entity}Repository) {\n  const execute = create${routeName}(repository);\n  return createApiRouter().openapi(definition, async (context) => {\n    const result = await execute(${validatedInput});${nullableGuard}\n    return context.json(${routeName}ResponseSchema.parse(${successValue}), 200);\n  });\n}`);

const testRequest = method === "get"
  ? `new Request("http://localhost${path}?limit=10")`
  : method === "post"
    ? `new Request("http://localhost${path}", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Example" }) })`
    : method === "delete"
      ? `new Request("http://localhost${path.replace("{id}", "1")}", { method: "DELETE" })`
      : `new Request("http://localhost${path.replace("{id}", "1")}", { method: "${method.toUpperCase()}", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "Updated" }) })`;
const expectedData = method === "get" ? `[]` : method === "delete" ? `{ deleted: false }` : method === "post" ? `{ id: "1", name: "Example" }` : `{ id: "1", name: "Updated" }`;
const seed = method === "put" || method === "patch" ? `\n    await repository.create({ name: "Before" });` : "";
const invalidRequest = method === "get"
  ? `new Request("http://localhost${path}?limit=0")`
  : method === "delete"
    ? null
    : `new Request("http://localhost${path.replace("{id}", "1")}", { method: "${method.toUpperCase()}", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: "" }) })`;
const validationTest = invalidRequest ? `\n\n  it("returns the standard validation error", async () => {\n    const response = await create${routeName}Route(new InMemory${entity}Repository()).request(${invalidRequest});\n    expect(response.status).toBe(400);\n    expect(await response.json()).toMatchObject({ error: { code: "VALIDATION_ERROR" } });\n  });` : "";
await writeNew(routeTestPath, `import { describe, expect, it } from "vitest";\nimport { InMemory${entity}Repository } from "../infrastructure/in-memory-${domain}-repository.js";\nimport { create${routeName}Route } from "./${name}.route.js";\n\ndescribe("${method.toUpperCase()} ${path}", () => {\n  it("validates and serves the generated contract", async () => {\n    const repository = new InMemory${entity}Repository();${seed}\n    const response = await create${routeName}Route(repository).request(${testRequest});\n    expect(response.status).toBe(200);\n    expect(await response.json()).toEqual({ data: ${expectedData} });\n  });${validationTest}\n\n  it("contributes its path to OpenAPI", async () => {\n    const app = create${routeName}Route(new InMemory${entity}Repository());\n    app.doc("/openapi.json", { openapi: "3.1.0", info: { title: "Test", version: "1" } });\n    const document = await (await app.request("/openapi.json")).json() as { paths: Record<string, unknown> };\n    expect(document.paths).toHaveProperty("${path}");\n  });\n});`);

await regenerateDomainPublic(domain);
await regenerateContractIndex();
const contractsManifestPath = join(ROOT, "packages/contracts/package.json");
const contractsManifest = await readJson(contractsManifestPath);
contractsManifest.exports[`./${domain}/${name}`] = `./src/${domain}/${name}.ts`;
contractsManifest.exports[`./${domain}/model`] = `./src/${domain}/model.ts`;
contractsManifest.exports = Object.fromEntries(Object.entries(contractsManifest.exports).sort(([a], [b]) => a.localeCompare(b)));
await writeJson(contractsManifestPath, contractsManifest);
await regenerateDomainModule(domain);
console.log(`Created ${method.toUpperCase()} ${path} in ${domain}. OpenAPI will include it at /openapi.json.`);
