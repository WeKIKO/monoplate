export type UpdateMode = "none" | "soft" | "force";
export type VersionPolicy = Readonly<{ minimumVersion: string; recommendedVersion?: string; storeUrl?: string }>;
export function compareVersions(left: string, right: string): number {
  const a = left.split(".").map(Number); const b = right.split(".").map(Number);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) { const difference = (a[index] ?? 0) - (b[index] ?? 0); if (difference) return difference > 0 ? 1 : -1; }
  return 0;
}
export function resolveUpdateMode(currentVersion: string, policy: VersionPolicy): UpdateMode {
  if (compareVersions(currentVersion, policy.minimumVersion) < 0) return "force";
  return policy.recommendedVersion && compareVersions(currentVersion, policy.recommendedVersion) < 0 ? "soft" : "none";
}
