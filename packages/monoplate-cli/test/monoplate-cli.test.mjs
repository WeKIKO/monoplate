import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyTemplateIgnore, buildInitializerArgs, parseArgs } from "../bin/monoplate-cli.mjs";

describe("monoplate CLI", () => {
  it("parses inline and separated options", () => {
    expect(parseArgs(["new", "happy", "--namespace=acme", "--primary-color", "#FF6B35", "--yes"])).toEqual({
      positional: ["new", "happy"],
      flags: { namespace: "acme", "primary-color": "#FF6B35", yes: "true" },
    });
  });

  it("maps CLI options to the template initializer contract", () => {
    expect(buildInitializerArgs("happy", { namespace: "acme", "display-name": "Happy App", "primary-color": "#FF6B35", "secondary-color": "#2563EB", yes: "true" })).toEqual([
      "run", "init", "--", "--name=happy", "--namespace=acme", "--displayName=Happy App", "--primaryColor=#FF6B35", "--secondaryColor=#2563EB", "--yes",
    ]);
  });

  it("removes template-only paths and rejects escapes", () => {
    const root = mkdtempSync(join(tmpdir(), "monoplate-cli-"));
    mkdirSync(join(root, "notes"));
    writeFileSync(join(root, "notes/internal.txt"), "private");
    writeFileSync(join(root, ".template-ignore"), "notes\n");
    expect(applyTemplateIgnore(root)).toEqual(["notes"]);
    expect(() => readFileSync(join(root, "notes/internal.txt"))).toThrow();
    writeFileSync(join(root, ".template-ignore"), "../outside\n");
    expect(() => applyTemplateIgnore(root)).toThrow("Unsafe");
  });
});
