import { createContext, useContext, useEffect, type ReactNode } from "react";

export type PushMessage = Readonly<{ id: string; title?: string; body?: string; deepLink?: string; data?: Readonly<Record<string, unknown>> }>;
export interface PushAdapter {
  getToken(): Promise<string | null>;
  subscribe(listener: (message: PushMessage) => void): () => void;
  subscribeToResponses(listener: (message: PushMessage) => void): () => void;
}
export const noopPushAdapter: PushAdapter = { getToken: async () => null, subscribe: () => () => undefined, subscribeToResponses: () => () => undefined };
const PushContext = createContext<PushAdapter>(noopPushAdapter);

export function PushProvider({ adapter = noopPushAdapter, onOpen, children }: { adapter?: PushAdapter; onOpen?: (message: PushMessage) => void; children: ReactNode }) {
  useEffect(() => adapter.subscribeToResponses((message) => onOpen?.(message)), [adapter, onOpen]);
  return <PushContext.Provider value={adapter}>{children}</PushContext.Provider>;
}
export function usePush() { return useContext(PushContext); }
