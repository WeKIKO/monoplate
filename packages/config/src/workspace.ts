import { existsSync } from "node:fs";
import { dirname, parse, resolve } from "node:path";

const workspaceMarker = "pnpm-workspace.yaml";

export function findWorkspaceRoot(start = process.cwd()) {
  let directory = resolve(start);
  while (true) {
    if (existsSync(resolve(directory, workspaceMarker))) return directory;
    const parent = dirname(directory);
    if (parent === directory || directory === parse(directory).root) throw new Error(`Unable to find ${workspaceMarker} from ${start}`);
    directory = parent;
  }
}

export function resolveWorkspacePath(...segments: string[]) {
  return resolve(findWorkspaceRoot(), ...segments);
}
