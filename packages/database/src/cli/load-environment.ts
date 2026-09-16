import { config } from "dotenv";
import { resolve } from "node:path";

export const workspaceEnvironmentPath = resolve(import.meta.dirname, "../../../../.env");

config({ path: workspaceEnvironmentPath, quiet: true });
