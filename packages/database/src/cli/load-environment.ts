import { loadWorkspaceEnvironment } from "@monoplate/config/load";
import { resolveWorkspacePath } from "@monoplate/config/workspace";

export const workspaceEnvironmentPath = resolveWorkspacePath(".env");

loadWorkspaceEnvironment();
