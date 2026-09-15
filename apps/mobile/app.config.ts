import type { ConfigContext, ExpoConfig } from "expo/config";
import { config as loadEnv } from "dotenv";
import { resolve } from "node:path";
import { parseMobileEnv } from "@monoplate/config/mobile";

loadEnv({ path: resolve(__dirname, "../../.env"), quiet: true });
parseMobileEnv({ EXPO_PUBLIC_API_URL: process.env.EXPO_PUBLIC_API_URL, EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV, EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN });

export default ({ config }: ConfigContext): ExpoConfig => {
  const plugins: NonNullable<ExpoConfig["plugins"]> = ["expo-router", "expo-localization", "expo-secure-store", ["expo-splash-screen", { backgroundColor: "#F7F8FA" }]];
  if (process.env.EXPO_PUBLIC_SENTRY_DSN) plugins.push(["@sentry/react-native/expo", { organization: process.env.SENTRY_ORG, project: process.env.SENTRY_PROJECT }]);
  return ({
  ...config,
  name: process.env.APP_NAME ?? "Monoplate",
  slug: process.env.EXPO_SLUG ?? "monoplate",
  scheme: process.env.APP_SCHEME ?? "monoplate",
  version: "0.1.0",
  runtimeVersion: { policy: "appVersion" },
  orientation: "portrait",
  userInterfaceStyle: "automatic",
  ios: { bundleIdentifier: process.env.IOS_BUNDLE_IDENTIFIER ?? "com.example.monoplate", associatedDomains: process.env.APP_ASSOCIATED_DOMAIN ? [`applinks:${process.env.APP_ASSOCIATED_DOMAIN}`] : [] },
  android: { package: process.env.ANDROID_PACKAGE ?? "com.example.monoplate", intentFilters: process.env.APP_LINK_HOST ? [{ action: "VIEW", autoVerify: true, data: [{ scheme: "https", host: process.env.APP_LINK_HOST, pathPrefix: "/" }], category: ["BROWSABLE", "DEFAULT"] }] : [] },
  plugins,
  experiments: { typedRoutes: true },
  extra: {
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
    minimumAppVersion: process.env.EXPO_PUBLIC_MINIMUM_APP_VERSION ?? "0.1.0",
    recommendedAppVersion: process.env.EXPO_PUBLIC_RECOMMENDED_APP_VERSION,
    appStoreUrl: process.env.EXPO_PUBLIC_APP_STORE_URL,
  },
  });
};
