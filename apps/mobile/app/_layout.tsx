import "#mobile/styles/global.css";
import "#mobile/app/i18n";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AppSetup } from "#mobile/app/AppSetup";
import { AppProviders } from "#mobile/app/AppProviders";
import { GlobalErrorBoundary } from "#mobile/app/GlobalErrorBoundary";
import { initializeSentry } from "#mobile/infrastructure/sentry";
import { DeepLinkHandler } from "#mobile/app/DeepLinkHandler";
import { UpdateGate } from "#mobile/app/UpdateGate";

void SplashScreen.preventAutoHideAsync();
initializeSentry();
export default function RootLayout() {
  return <GlobalErrorBoundary><AppProviders><AppSetup><UpdateGate><DeepLinkHandler/><Stack screenOptions={{ headerShown: false }} /></UpdateGate></AppSetup></AppProviders></GlobalErrorBoundary>;
}
