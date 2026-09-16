import { config } from "dotenv";
import { resolve } from "node:path";
import { findWorkspaceRoot } from "@monoplate/config/workspace";

export function loadWorkspaceEnvironment(cwd = process.cwd()) {
  const workspaceRoot = findWorkspaceRoot(cwd);
  config({
    path: [...new Set([resolve(cwd, ".env"), resolve(workspaceRoot, ".env")])],
    quiet: true,
  });
}
