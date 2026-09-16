import * as Sentry from "@sentry/react-native";
import { env } from "#mobile/app/env";
import Constants from "expo-constants";
import * as Updates from "expo-updates";

export function initializeSentry() {
  const dsn = env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) return false;
  Sentry.init({ dsn, enabled: true, environment: env.EXPO_PUBLIC_APP_ENV, release: `${Constants.expoConfig?.slug ?? "monoplate"}@${Constants.expoConfig?.version ?? "0.0.0"}`, dist: Updates.updateId ?? undefined });
  return true;
}

export function captureException(error: unknown) {
  if (env.EXPO_PUBLIC_SENTRY_DSN) Sentry.captureException(error);
}
