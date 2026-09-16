import "#mobile/styles/global.css";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { AppSetup } from "#mobile/application/AppSetup";
import { AppProviders } from "#mobile/application/AppProviders";
import { GlobalErrorBoundary } from "#mobile/application/GlobalErrorBoundary";
import { initializeSentry } from "#mobile/infrastructure/sentry";
import { DeepLinkHandler } from "#mobile/application/DeepLinkHandler";
import { UpdateGate } from "#mobile/application/UpdateGate";

void SplashScreen.preventAutoHideAsync();
initializeSentry();
export default function RootLayout() {
  return <GlobalErrorBoundary><AppProviders><AppSetup><UpdateGate><DeepLinkHandler/><Stack screenOptions={{ headerShown: false }} /></UpdateGate></AppSetup></AppProviders></GlobalErrorBoundary>;
}
