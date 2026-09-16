import * as Updates from "expo-updates";
import { captureOtaFailure } from "./sentry";
import { diagnosticsStorage } from "./storage";

const FAILED_UPDATE_KEY = "ota.failed-update";
export type OtaFailure = Readonly<{ at: string; message: string; operation: "check" | "download" | "reload" }>;

async function recordFailure(error: unknown, operation: OtaFailure["operation"]) {
  const failure: OtaFailure = { at: new Date().toISOString(), message: error instanceof Error ? error.message : "unknown", operation };
  try { await diagnosticsStorage.set(FAILED_UPDATE_KEY, JSON.stringify(failure)); }
  catch (storageError) { captureOtaFailure(storageError, operation); }
  captureOtaFailure(error, operation);
  if (__DEV__) console.warn("OTA update failed", failure);
}

export async function checkForOtaUpdate(): Promise<"unavailable" | "downloaded" | "failed"> {
  if (!Updates.isEnabled) return "unavailable";
  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return "unavailable";
    try { await Updates.fetchUpdateAsync(); }
    catch (error) { await recordFailure(error, "download"); return "failed"; }
    await diagnosticsStorage.remove(FAILED_UPDATE_KEY);
    return "downloaded";
  } catch (error) {
    await recordFailure(error, "check");
    return "failed";
  }
}

export async function applyDownloadedOtaUpdate() {
  try { await Updates.reloadAsync(); }
  catch (error) { await recordFailure(error, "reload"); throw error; }
}

export async function getLastOtaFailure(): Promise<OtaFailure | null> {
  const stored = await diagnosticsStorage.get(FAILED_UPDATE_KEY);
  if (!stored) return null;
  try { return JSON.parse(stored) as OtaFailure; }
  catch { await diagnosticsStorage.remove(FAILED_UPDATE_KEY); return null; }
}
