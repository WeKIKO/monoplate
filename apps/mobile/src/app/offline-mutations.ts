export type ConflictResolution = "keep-local" | "accept-server" | "retry";
export class MutationConflictError<T = unknown> extends Error { constructor(readonly serverValue: T) { super("Mutation conflicted with the server state"); this.name = "MutationConflictError"; } }
export function isConflictStatus(status: number) { return status === 409 || status === 412; }
export async function resolveConflict<T>(resolution: ConflictResolution, localValue: T, serverValue: T): Promise<T> {
  if (resolution === "accept-server") return serverValue;
  return localValue;
}
