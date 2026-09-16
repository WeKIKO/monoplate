import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { execPath } from "node:process";
import { fileURLToPath, URL } from "node:url";
import { describe, expect, it } from "vitest";
import { applyTemplateIgnore, buildInitializerArgs, parseArgs } from "../bin/monoplate-cli.mjs";

describe("monoplate CLI", () => {
  it("runs through the published bin entrypoint", () => {
    const result = spawnSync(execPath, [fileURLToPath(new URL("../bin/run.mjs", import.meta.url)), "--help"], { encoding: "utf8" });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain("@xierra/monoplate-cli");
  });

  it("parses inline and separated options", () => {
    expect(parseArgs(["new", "happy", "--namespace=acme", "--primary-color", "#FF6B35", "--yes"])).toEqual({
      positional: ["new", "happy"],
      flags: { namespace: "acme", "primary-color": "#FF6B35", yes: "true" },
    });
  });

  it("maps CLI options to the template initializer contract", () => {
    expect(buildInitializerArgs("happy", { namespace: "acme", "display-name": "Happy App", "primary-color": "#FF6B35", "secondary-color": "#2563EB", "ios-bundle-name": "com.acme.happy", "android-package-name": "com.acme.happy", yes: "true" })).toEqual([
      "run", "init", "--", "--name=happy", "--namespace=acme", "--displayName=Happy App", "--primaryColor=#FF6B35", "--secondaryColor=#2563EB", "--iosBundleIdentifier=com.acme.happy", "--androidPackage=com.acme.happy", "--yes",
    ]);
  });

  it("removes template-only paths and rejects escapes", () => {
    const root = mkdtempSync(join(tmpdir(), "monoplate-cli-"));
    mkdirSync(join(root, "notes"));
    mkdirSync(join(root, ".github/workflows"), { recursive: true });
    writeFileSync(join(root, "notes/internal.txt"), "private");
    writeFileSync(join(root, ".github/workflows/publish-cli.yml"), "name: publish\n");
    writeFileSync(join(root, ".template-ignore"), "notes\n.github/workflows/publish-cli.yml\n");
    expect(applyTemplateIgnore(root)).toEqual(["notes", ".github/workflows/publish-cli.yml"]);
    expect(() => readFileSync(join(root, "notes/internal.txt"))).toThrow();
    expect(() => readFileSync(join(root, ".github/workflows/publish-cli.yml"))).toThrow();
    writeFileSync(join(root, ".template-ignore"), "../outside\n");
    expect(() => applyTemplateIgnore(root)).toThrow("Unsafe");
  });
});
