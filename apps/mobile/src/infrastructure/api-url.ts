export function resolveApiUrl(configuredUrl: string, options: Readonly<{ platform?: string; devHost?: string | null }> = {}): string {
  const platform = options.platform ?? "ios";
  const devHost = options.devHost?.split(":")[0];
  const url = new URL(configuredUrl);
  if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") return url.toString().replace(/\/$/, "");
  if (devHost) url.hostname = devHost;
  else if (platform === "android") url.hostname = "10.0.2.2";
  return url.toString().replace(/\/$/, "");
}
