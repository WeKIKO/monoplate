import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Pressable, Text, View } from "react-native";
import { resolveUpdateMode, type UpdateMode, type VersionPolicy } from "./version-policy";

type Extra = Readonly<{ minimumAppVersion?: string; recommendedAppVersion?: string; appStoreUrl?: string }>;
export function UpdateGate({ children }: { children: ReactNode }) {
  const extra = (Constants.expoConfig?.extra ?? {}) as Extra;
  const policy = useMemo<VersionPolicy>(() => ({ minimumVersion: extra.minimumAppVersion ?? "0.0.0", ...(extra.recommendedAppVersion ? { recommendedVersion: extra.recommendedAppVersion } : {}), ...(extra.appStoreUrl ? { storeUrl: extra.appStoreUrl } : {}) }), [extra.appStoreUrl, extra.minimumAppVersion, extra.recommendedAppVersion]);
  const [dismissed, setDismissed] = useState(false);
  const [mode, setMode] = useState<UpdateMode>("none");
  useEffect(() => setMode(resolveUpdateMode(Constants.expoConfig?.version ?? "0.0.0", policy)), [policy]);
  if (mode === "none" || (mode === "soft" && dismissed)) return children;
  return <View className="flex-1 items-center justify-center bg-background p-lg" accessibilityViewIsModal>
    <Text accessibilityRole="header" className="font-heading text-2xl text-foreground">Update available</Text>
    <Text className="mt-sm text-center text-foreground">{mode === "force" ? "This version is no longer supported. Update to continue." : "A newer version is available."}</Text>
    {policy.storeUrl ? <Pressable accessibilityRole="link" className="mt-lg rounded-md bg-primary p-md" onPress={() => void Linking.openURL(policy.storeUrl!)}><Text className="text-white">Update now</Text></Pressable> : null}
    {mode === "soft" ? <Pressable accessibilityRole="button" className="mt-sm p-md" onPress={() => setDismissed(true)}><Text className="text-foreground">Later</Text></Pressable> : null}
  </View>;
}
