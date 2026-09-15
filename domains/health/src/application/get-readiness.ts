import type { Health } from "../domain/health.js";
import type { ReadinessProbe } from "./ports/readiness-probe.js";

export async function getReadiness(probe: ReadinessProbe): Promise<Health> {
  return { status: await probe.check() ? "ok" : "unavailable" };
}
