import AsyncStorage from "@react-native-async-storage/async-storage";
import { Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { useIsRestoring } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState, type ReactNode } from "react";
import { i18n } from "./i18n";
import { checkForOtaUpdate } from "../infrastructure/ota-updates";

export function AppSetup({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const restoringQueries = useIsRestoring();
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_700Bold });
  useEffect(() => { let active = true; void Promise.all([i18n.isInitialized ? Promise.resolve() : new Promise<void>((resolve) => i18n.on("initialized", () => resolve())), AsyncStorage.getItem("MONOPLATE_SETTINGS"), checkForOtaUpdate()]).finally(() => { if (active) setReady(true); }); return () => { active = false; }; }, []);
  const initialized = ready && !restoringQueries && (fontsLoaded || Boolean(fontError));
  useEffect(() => { if (initialized) void SplashScreen.hideAsync(); }, [initialized]);
  return initialized ? children : null;
}
