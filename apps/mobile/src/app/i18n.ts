import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

void i18n.use(initReactI18next).init({
  compatibilityJSON: "v4",
  lng: Localization.getLocales()[0]?.languageCode ?? "en",
  fallbackLng: "en",
  resources: { en: { translation: { welcome: "Welcome to Monoplate" } }, ko: { translation: { welcome: "Monoplate에 오신 것을 환영합니다" } } },
  interpolation: { escapeValue: false },
});
export { i18n };
