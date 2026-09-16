import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

let initialization: Promise<void> | undefined;

export function initializeI18n() {
  if (i18n.isInitialized) return Promise.resolve();
  initialization ??= i18n.use(initReactI18next).init({
    compatibilityJSON: "v4",
    lng: Localization.getLocales()[0]?.languageCode ?? "en",
    fallbackLng: "en",
    resources: { en: { translation: { welcome: "Welcome to Monoplate" } }, ko: { translation: { welcome: "Monoplate에 오신 것을 환영합니다" } } },
    interpolation: { escapeValue: false },
  }).then(() => undefined).catch((error: unknown) => {
    initialization = undefined;
    throw error;
  });
  return initialization;
}

export { i18n };
