import { env } from "#mobile/application/env";
import { resolveApiUrl } from "./api-url";
const apiUrl = resolveApiUrl(env.EXPO_PUBLIC_API_URL, { ...(process.env.EXPO_OS ? { platform: process.env.EXPO_OS } : {}), ...(env.EXPO_PUBLIC_DEV_HOST ? { devHost: env.EXPO_PUBLIC_DEV_HOST } : {}) });
let getAccessToken: () => Promise<string | null> = async () => null;
let refreshAccessToken: () => Promise<string | null> = async () => null;
export function setAccessTokenProvider(provider: () => Promise<string | null>) { getAccessToken = provider; }
export function setTokenRefreshHandler(handler: () => Promise<string | null>) { refreshAccessToken = handler; }
export class ApiError extends Error { constructor(readonly status: number, message: string) { super(message); } }
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const url = `${apiUrl}${path.startsWith("/") ? path : `/${path}`}`;
  let response = await fetch(url, { ...init, headers: { accept: "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  if (response.status === 401 && token) { const refreshed = await refreshAccessToken(); if (refreshed) response = await fetch(url, { ...init, headers: { accept: "application/json", authorization: `Bearer ${refreshed}`, ...init?.headers } }); }
  if (!response.ok) throw new ApiError(response.status, `API request failed (${response.status})`);
  return response.json() as Promise<T>;
}
