import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Updates from "expo-updates";

const FAILED_UPDATE_KEY = "monoplate.ota.failed-update";
export async function checkForOtaUpdate(): Promise<"unavailable" | "downloaded" | "failed"> {
  if (!Updates.isEnabled) return "unavailable";
  try {
    const update = await Updates.checkForUpdateAsync();
    if (!update.isAvailable) return "unavailable";
    await Updates.fetchUpdateAsync();
    await AsyncStorage.removeItem(FAILED_UPDATE_KEY);
    return "downloaded";
  } catch (error) {
    await AsyncStorage.setItem(FAILED_UPDATE_KEY, JSON.stringify({ at: new Date().toISOString(), message: error instanceof Error ? error.message : "unknown" }));
    return "failed";
  }
}
export async function getLastOtaFailure() { return AsyncStorage.getItem(FAILED_UPDATE_KEY); }
