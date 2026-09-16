import { config } from "dotenv";
import { resolve } from "node:path";

export function loadWorkspaceEnvironment(cwd = process.cwd()) {
  config({
    path: [resolve(cwd, ".env"), resolve(cwd, "../../.env")],
    quiet: true,
  });
}
