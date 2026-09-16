import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";
import { onlineManager } from "@tanstack/react-query";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type NetworkState = Readonly<{ isConnected: boolean; isInternetReachable: boolean | null }>;
const NetworkContext = createContext<NetworkState>({ isConnected: true, isInternetReachable: null });
export function NetworkProvider({ children }: { children: ReactNode }) {
  const [network, setNetwork] = useState<NetworkState>({ isConnected: true, isInternetReachable: null });
  useEffect(() => NetInfo.addEventListener((state: NetInfoState) => {
    const isConnected = Boolean(state.isConnected);
    onlineManager.setOnline(isConnected);
    setNetwork({ isConnected, isInternetReachable: state.isInternetReachable });
  }), []);
  return <NetworkContext.Provider value={network}>{children}</NetworkContext.Provider>;
}
export function useNetwork() { return useContext(NetworkContext); }
