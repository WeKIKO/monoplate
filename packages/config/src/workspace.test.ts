import { dirname } from "node:path";
import { describe, expect, it } from "vitest";
import { findWorkspaceRoot, resolveWorkspacePath } from "./workspace.js";

describe("workspace paths", () => {
  it("finds the workspace without relying on a fixed parent depth", () => {
    const root = findWorkspaceRoot(import.meta.dirname);
    expect(findWorkspaceRoot(dirname(import.meta.dirname))).toBe(root);
    expect(resolveWorkspacePath("packages", "config")).toBe(dirname(import.meta.dirname));
  });
});
