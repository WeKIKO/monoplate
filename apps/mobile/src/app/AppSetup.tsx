import { Inter_400Regular, Inter_700Bold, useFonts } from "@expo-google-fonts/inter";
import { useIsRestoring } from "@tanstack/react-query";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { applyDownloadedOtaUpdate, checkForOtaUpdate } from "#mobile/infrastructure/ota-updates";
import { captureException } from "#mobile/infrastructure/sentry";
import { preferencesStorage } from "#mobile/infrastructure/storage";
import { useAuth } from "./auth";
import { initializeI18n } from "./i18n";

const STARTUP_TIMEOUT_MS = 8_000;
type StartupStatus = "booting" | "ready" | "failed";

function withTimeout<T>(operation: Promise<T>, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} initialization timed out`)), STARTUP_TIMEOUT_MS);
    operation.then(
      (value) => { clearTimeout(timer); resolve(value); },
      (error: unknown) => { clearTimeout(timer); reject(error); },
    );
  });
}

function BootstrapAttempt({ onReady, onFailure }: Readonly<{ onReady(): void; onFailure(error: Error): void }>) {
  const { restoreSession } = useAuth();
  const restoringQueries = useIsRestoring();
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_700Bold });

  useEffect(() => {
    if (fontError) onFailure(fontError);
  }, [fontError, onFailure]);

  useEffect(() => {
    if (!fontsLoaded || restoringQueries) return;
    let active = true;
    void Promise.all([
      withTimeout(initializeI18n(), "i18n"),
      withTimeout(restoreSession(), "session"),
      withTimeout(preferencesStorage.get("settings"), "preferences"),
    ]).then(
      () => { if (active) onReady(); },
      (error: unknown) => { if (active) onFailure(error instanceof Error ? error : new Error("App initialization failed")); },
    );
    return () => { active = false; };
  }, [fontsLoaded, onFailure, onReady, restoreSession, restoringQueries]);

  useEffect(() => {
    const timer = setTimeout(() => onFailure(new Error("Local resources initialization timed out")), STARTUP_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [onFailure]);

  return null;
}

function StartupFailure({ onRetry }: Readonly<{ onRetry(): void }>) {
  return (
    <View className="flex-1 items-center justify-center bg-white px-8 dark:bg-neutral-950">
      <Text className="text-center text-xl font-bold text-neutral-950 dark:text-white">앱을 시작하지 못했어요</Text>
      <Text className="mt-3 text-center text-base leading-6 text-neutral-600 dark:text-neutral-300">
        네트워크와 기기 상태를 확인한 뒤 다시 시도해 주세요.
      </Text>
      <Pressable
        accessibilityRole="button"
        className="mt-7 min-w-40 items-center rounded-xl bg-neutral-950 px-6 py-4 dark:bg-white"
        onPress={onRetry}
      >
        <Text className="font-bold text-white dark:text-neutral-950">다시 시도</Text>
      </Pressable>
    </View>
  );
}

function OtaUpdatePrompt({ visible }: Readonly<{ visible: boolean }>) {
  const [restarting, setRestarting] = useState(false);
  const restart = useCallback(async () => {
    setRestarting(true);
    try { await applyDownloadedOtaUpdate(); }
    catch { setRestarting(false); }
  }, []);
  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View className="flex-1 items-center justify-center bg-black/40 px-8" accessibilityViewIsModal>
        <View className="w-full rounded-2xl bg-white p-6 dark:bg-neutral-900">
          <Text accessibilityRole="header" className="text-xl font-bold text-neutral-950 dark:text-white">업데이트 준비 완료</Text>
          <Text className="mt-3 text-base leading-6 text-neutral-600 dark:text-neutral-300">새 버전을 적용하려면 앱을 다시 시작해 주세요.</Text>
          <Pressable
            accessibilityRole="button"
            className="mt-6 items-center rounded-xl bg-neutral-950 px-6 py-4 dark:bg-white"
            disabled={restarting}
            onPress={() => void restart()}
          >
            <Text className="font-bold text-white dark:text-neutral-950">{restarting ? "다시 시작하는 중…" : "지금 다시 시작"}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export function AppSetup({ children }: { children: ReactNode }) {
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState<StartupStatus>("booting");
  const [otaDownloaded, setOtaDownloaded] = useState(false);

  const handleReady = useCallback(() => setStatus("ready"), []);
  const handleFailure = useCallback((error: Error) => {
    captureException(error);
    setStatus("failed");
  }, []);
  const retry = useCallback(() => {
    setAttempt((current) => current + 1);
    setStatus("booting");
  }, []);

  useEffect(() => {
    if (status !== "booting") void SplashScreen.hideAsync();
  }, [status]);

  useEffect(() => {
    if (status !== "ready") return;
    let active = true;
    void checkForOtaUpdate().then((result) => { if (active && result === "downloaded") setOtaDownloaded(true); });
    return () => { active = false; };
  }, [status]);

  if (status === "failed") return <StartupFailure onRetry={retry} />;
  if (status === "ready") return <>{children}<OtaUpdatePrompt visible={otaDownloaded} /></>;
  return <BootstrapAttempt key={attempt} onFailure={handleFailure} onReady={handleReady} />;
}
