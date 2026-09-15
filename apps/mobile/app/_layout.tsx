import "../src/styles/global.css";
import "../src/app/i18n";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AppSetup } from "../src/app/AppSetup";
import { AppProviders } from "../src/app/AppProviders";
import { GlobalErrorBoundary } from "../src/app/GlobalErrorBoundary";
import { initializeSentry } from "../src/infrastructure/sentry";
import { DeepLinkHandler } from "../src/app/DeepLinkHandler";
import { UpdateGate } from "../src/app/UpdateGate";

void SplashScreen.preventAutoHideAsync();
initializeSentry();
export default function RootLayout() {
  return <GlobalErrorBoundary><AppProviders><AppSetup><UpdateGate><DeepLinkHandler/><Stack screenOptions={{ headerShown: false }} /></UpdateGate></AppSetup></AppProviders></GlobalErrorBoundary>;
}
