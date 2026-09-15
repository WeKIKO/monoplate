import { parseAdminEnv } from "@monoplate/config/admin";
const baseUrl = parseAdminEnv(import.meta.env).VITE_API_URL.replace(/\/$/, "");
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const token = typeof sessionStorage === "undefined" ? null : sessionStorage.getItem("monoplate.admin.access-token");
  const url = `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
  let response = await fetch(url, { ...init, headers: { accept: "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}), ...init?.headers } });
  if (response.status === 401 && token && typeof localStorage !== "undefined") {
    const refreshToken = localStorage.getItem("monoplate.admin.refresh-token");
    if (refreshToken) { const refresh = await fetch(`${baseUrl}/api/v1/auth/refresh`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken }) }); if (refresh.ok) { const payload = await refresh.json() as { data: { accessToken: string; refreshToken: string } }; sessionStorage.setItem("monoplate.admin.access-token", payload.data.accessToken); localStorage.setItem("monoplate.admin.refresh-token", payload.data.refreshToken); response = await fetch(url, { ...init, headers: { accept: "application/json", authorization: `Bearer ${payload.data.accessToken}`, ...init?.headers } }); } else { sessionStorage.removeItem("monoplate.admin.access-token"); localStorage.removeItem("monoplate.admin.refresh-token"); } }
  }
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}
