import * as Linking from "expo-linking";
import { useEffect } from "react";
import { navigation } from "./navigation";
import { destinationPath, parseDeepLink } from "./deep-links";

export function DeepLinkHandler() {
  useEffect(() => {
    const open = (url: string | null) => { if (!url) return; const destination = parseDeepLink(url); if (destination) navigation.push(destinationPath(destination)); };
    void Linking.getInitialURL().then(open);
    const subscription = Linking.addEventListener("url", ({ url }) => open(url));
    return () => subscription.remove();
  }, []);
  return null;
}
