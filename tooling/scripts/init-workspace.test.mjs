import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { initialize } from "./init-workspace.mjs";

const roots = [];
afterEach(async () => { delete process.env.MONOPLATE_TEST_FAIL_AFTER; await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))); });

async function fixture(prefix = "monoplate test ") {
  const root = await mkdtemp(join(tmpdir(), prefix));
  roots.push(root);
  await mkdir(join(root, "apps/mobile"), { recursive: true });
  await mkdir(join(root, "packages/design-tokens/generated"), { recursive: true });
  await mkdir(join(root, "packages/design-tokens/src"), { recursive: true });
  await writeFile(join(root, "package.json"), '{"name": "monoplate", "dependencies":{"@monoplate/config":"workspace:*"}}\n');
  await writeFile(join(root, "apps/mobile/app.config.ts"), 'export default { ios: { bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER ?? "com.monoplate.app" }, android: { package: process.env.ANDROID_PACKAGE ?? "com.monoplate.app" } };\n');
  await writeFile(join(root, "packages/design-tokens/tokens.json"), '{"primary":"#4F46E5","fonts":{"body":"Inter_400Regular","heading":"Inter_700Bold"},"spacing":{"md":16},"radius":{"md":10}}\n');
  await writeFile(join(root, "packages/design-tokens/generated/theme.css"), "stale\n");
  await writeFile(join(root, "packages/design-tokens/generated/tailwind.cjs"), "stale\n");
  await writeFile(join(root, "packages/design-tokens/src/index.ts"), "stale\n");
  return root;
}

describe("workspace initializer", () => {
  it.each([
    ["acme", "shop", "Acme Shop", "com.acme.shop", "com.acme.shop"],
    ["hello-world", "field-app", "현장 앱", "io.example.field", "io.example.field"]
  ])("creates a golden identity for %s", async (namespace, name, displayName, iosBundleIdentifier, androidPackage) => {
    const root = await fixture();
    const result = await initialize({ root, args: { namespace, name, displayName, iosBundleIdentifier, androidPackage }, output: { write() {} } });
    expect(result.metadata).toMatchObject({ project: name, namespace: `@${namespace}`, displayName, iosBundleIdentifier, androidPackage });
    expect(await readFile(join(root, "package.json"), "utf8")).toContain(`@${namespace}/config`);
    expect(await readFile(join(root, "apps/mobile/app.config.ts"), "utf8")).toContain(iosBundleIdentifier);
    expect(JSON.parse(await readFile(join(root, ".monoplate/generated.json"), "utf8"))).toMatchObject({ generator: "monoplate", templateVersion: "0.1.0" });
  });

  it("is idempotent for the same options and rejects identity drift", async () => {
    const root = await fixture();
    const args = { namespace: "acme", name: "shop", displayName: "Shop" };
    await initialize({ root, args, output: { write() {} } });
    await expect(initialize({ root, args, output: { write() {} } })).resolves.toMatchObject({ changed: 0 });
    await expect(initialize({ root, args: { ...args, name: "other" }, output: { write() {} } })).rejects.toThrow("already initialized");
  });

  it("records optional features and validates dependencies", async () => {
    const root = await fixture();
    const result = await initialize({ root, args: { namespace: "acme", name: "shop", "with-admin": "false", "with-sentry": "false", "with-auth": "false", "with-database": "false", "with-eas": "false", "with-observability": "false" }, output: { write() {} } });
    expect(result.metadata.features).toEqual({ admin: false, sentry: false, auth: false, database: false, eas: false, observability: false });
    const invalidRoot = await fixture();
    await expect(initialize({ root: invalidRoot, args: { namespace: "acme", name: "shop", "with-database": "false" }, output: { write() {} } })).rejects.toThrow("requires --with-database");
  });

  it("generates matching light and dark theme tokens from the primary color", async () => {
    const root = await fixture();
    const result = await initialize({ root, args: { namespace: "acme", name: "shop", primaryColor: "#ff6b35", secondaryColor: "#2563EB", tertiaryColor: "#10B981", errorColor: "#DC2626" }, output: { write() {} } });
    expect(result.metadata.theme).toEqual({ primary: "#FF6B35", secondary: "#2563EB", tertiary: "#10B981", error: "#DC2626" });
    expect(JSON.parse(await readFile(join(root, "packages/design-tokens/tokens.json"), "utf8"))).toMatchObject({ primary: "#FF6B35", secondary: "#2563EB", tertiary: "#10B981", error: "#DC2626" });
    const theme = await readFile(join(root, "packages/design-tokens/generated/theme.css"), "utf8");
    expect(theme).toContain(':root[data-theme="dark"], .dark');
    expect(theme).toContain("--color-primary-container:");
    expect(theme).not.toContain("#4F46E5");
  });

  it("rolls back every write after a failure", async () => {
    const root = await fixture();
    const before = await readFile(join(root, "package.json"), "utf8");
    process.env.MONOPLATE_TEST_FAIL_AFTER = "2";
    await expect(initialize({ root, args: { namespace: "acme", name: "shop" }, output: { write() {} } })).rejects.toThrow("Injected");
    expect(await readFile(join(root, "package.json"), "utf8")).toBe(before);
    await expect(readFile(join(root, ".monoplate/project.json"), "utf8")).rejects.toThrow();
  });
});
