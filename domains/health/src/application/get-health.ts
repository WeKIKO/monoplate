import type { Health } from "../domain/health.js";

export function getHealth(): Health {
  return { status: "ok" };
}
