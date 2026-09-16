import { Component, type ErrorInfo, type ReactNode } from "react";
import { Text, View } from "react-native";
import * as SplashScreen from "expo-splash-screen";
import { captureException } from "#mobile/infrastructure/sentry";

export class GlobalErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { void SplashScreen.hideAsync(); captureException(error); console.error("Unhandled render error", error, info); }
  render() { return this.state.failed ? <View className="flex-1 items-center justify-center bg-background p-lg"><Text className="text-danger">Something went wrong.</Text></View> : this.props.children; }
}
