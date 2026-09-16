import type { Health } from "#health/domain/health.js";

export function getHealth(): Health {
  return { status: "ok" };
}
