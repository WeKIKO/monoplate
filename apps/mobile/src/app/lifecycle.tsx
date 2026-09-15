import { focusManager } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { AccessibilityInfo, AppState, type AppStateStatus } from "react-native";

type Lifecycle = Readonly<{ appState: AppStateStatus; isForeground: boolean; reduceMotion: boolean }>;
const LifecycleContext = createContext<Lifecycle>({ appState: AppState.currentState, isForeground: AppState.currentState === "active", reduceMotion: false });

export function LifecycleProvider({ children }: { children: ReactNode }) {
  const [appState, setAppState] = useState(AppState.currentState);
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const appSubscription = AppState.addEventListener("change", (next) => { setAppState(next); focusManager.setFocused(next === "active"); });
    const motionSubscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);
    return () => { appSubscription.remove(); motionSubscription.remove(); };
  }, []);
  return <LifecycleContext.Provider value={{ appState, isForeground: appState === "active", reduceMotion }}>{children}</LifecycleContext.Provider>;
}

export function useLifecycle() { return useContext(LifecycleContext); }
