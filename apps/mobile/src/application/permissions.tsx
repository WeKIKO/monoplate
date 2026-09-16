import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useLifecycle } from "./lifecycle";

export type PermissionStatus = "undetermined" | "granted" | "denied";
type Rationale = Readonly<{ name: string; title: string; message: string; requester: () => Promise<PermissionStatus>; resolve: (status: PermissionStatus) => void }>;
type PermissionContextValue = Readonly<{ statuses: Readonly<Record<string, PermissionStatus>>; request(name: string, requester: () => Promise<PermissionStatus>): Promise<PermissionStatus>; requestWithRationale(name: string, rationale: Readonly<{ title: string; message: string }>, requester: () => Promise<PermissionStatus>): Promise<PermissionStatus> }>;
const PermissionContext = createContext<PermissionContextValue | null>(null);
export function PermissionProvider({ children }: { children: ReactNode }) {
  const { reduceMotion } = useLifecycle();
  const [statuses, setStatuses] = useState<Record<string, PermissionStatus>>({});
  const [rationale, setRationale] = useState<Rationale | null>(null);
  const request = useCallback(async (name: string, requester: () => Promise<PermissionStatus>) => { const status = await requester(); setStatuses((current) => ({ ...current, [name]: status })); return status; }, []);
  const requestWithRationale = useCallback((name: string, copy: { title: string; message: string }, requester: () => Promise<PermissionStatus>) => new Promise<PermissionStatus>((resolve) => setRationale({ name, ...copy, requester, resolve })), []);
  const dismiss = useCallback(() => { rationale?.resolve("undetermined"); setRationale(null); }, [rationale]);
  const continueRequest = useCallback(async () => { if (!rationale) return; const pending = rationale; setRationale(null); pending.resolve(await request(pending.name, pending.requester)); }, [rationale, request]);
  const value = useMemo(() => ({ statuses, request, requestWithRationale }), [request, requestWithRationale, statuses]);
  return <PermissionContext.Provider value={value}>{children}<Modal transparent visible={Boolean(rationale)} animationType={reduceMotion ? "none" : "fade"} onRequestClose={dismiss}><View className="flex-1 items-center justify-center bg-black/40 p-lg" accessibilityViewIsModal><View className="w-full rounded-lg bg-background p-lg"><Text className="font-heading text-xl text-foreground" accessibilityRole="header">{rationale?.title}</Text><Text className="mt-sm text-foreground">{rationale?.message}</Text><Pressable accessibilityRole="button" className="mt-lg rounded-md bg-primary p-md" onPress={() => void continueRequest()}><Text className="text-center text-white">Continue</Text></Pressable><Pressable accessibilityRole="button" className="mt-sm p-md" onPress={dismiss}><Text className="text-center text-foreground">Not now</Text></Pressable></View></View></Modal></PermissionContext.Provider>;
}
export function usePermissions() { const value = useContext(PermissionContext); if (!value) throw new Error("usePermissions must be used inside PermissionProvider"); return value; }
