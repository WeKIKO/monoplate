import * as Linking from "expo-linking";

export type DeepLinkDestination =
  | Readonly<{ kind: "home" }>
  | Readonly<{ kind: "reset-password"; token: string }>;

export function parseDeepLink(url: string): DeepLinkDestination | null {
  const { hostname, path, queryParams } = Linking.parse(url);
  const route = [hostname, path].filter(Boolean).join("/").replace(/^\/+|\/+$/g, "");
  if (!route || route === "home") return { kind: "home" };
  if (route === "auth/reset-password" && typeof queryParams?.token === "string" && queryParams.token.length > 0) {
    return { kind: "reset-password", token: queryParams.token };
  }
  return null;
}

export function destinationPath(destination: DeepLinkDestination): "/" | { pathname: "/auth/reset-password"; params: { token: string } } {
  return destination.kind === "home" ? "/" : { pathname: "/auth/reset-password", params: { token: destination.token } };
}
