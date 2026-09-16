import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import type { ReactNode } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NetworkProvider } from "./network";
import { OverlayProvider } from "./overlay";
import { PermissionProvider } from "./permissions";
import { ThemeProvider } from "./theme";
import { AuthProvider } from "./auth";
import { LifecycleProvider } from "./lifecycle";
import { PushProvider } from "./push";
import { queryCacheStorage } from "#mobile/infrastructure/storage";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 2, staleTime: 30_000, networkMode: "offlineFirst" }, mutations: { networkMode: "offlineFirst", retry: 2 } } });
const persister = createAsyncStoragePersister({ storage: queryCacheStorage, key: "MONOPLATE_QUERY_CACHE" });

export function AppProviders({ children }: { children: ReactNode }) {
  return <GestureHandlerRootView className="flex-1"><SafeAreaProvider><ThemeProvider><LifecycleProvider><NetworkProvider><PermissionProvider><PersistQueryClientProvider client={queryClient} persistOptions={{ persister, buster: "v1", dehydrateOptions: { shouldDehydrateMutation: () => true } }} onSuccess={() => queryClient.resumePausedMutations()}><AuthProvider><OverlayProvider><PushProvider>{children}</PushProvider></OverlayProvider></AuthProvider></PersistQueryClientProvider></PermissionProvider></NetworkProvider></LifecycleProvider></ThemeProvider></SafeAreaProvider></GestureHandlerRootView>;
}
