import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useLifecycle } from "./lifecycle";

type Overlay = Readonly<{ title: string; message?: string }>;
type OverlayContextValue = Readonly<{ show(overlay: Overlay): void; hide(): void }>;
const OverlayContext = createContext<OverlayContextValue | null>(null);
export function OverlayProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useLifecycle();
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  const hide = useCallback(() => setOverlay(null), []);
  const value = useMemo(() => ({ show: setOverlay, hide }), [hide]);
  return <OverlayContext.Provider value={value}>{children}<Modal transparent visible={Boolean(overlay)} animationType={reduceMotion ? "none" : "fade"} onRequestClose={hide}><View className="flex-1 items-center justify-center bg-black/40 p-lg" accessibilityViewIsModal><View className="w-full rounded-lg bg-background p-lg"><Text accessibilityRole="header" className="font-heading text-xl text-foreground">{overlay?.title}</Text>{overlay?.message ? <Text className="mt-sm text-foreground">{overlay.message}</Text> : null}<Pressable accessibilityRole="button" className="mt-lg rounded-md bg-primary p-md" onPress={hide}><Text className="text-center text-white">Close</Text></Pressable></View></View></Modal></OverlayContext.Provider>;
}
export function useOverlay() { const value = useContext(OverlayContext); if (!value) throw new Error("useOverlay must be used inside OverlayProvider"); return value; }
