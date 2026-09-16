import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setAccessTokenProvider, setTokenRefreshHandler } from "#mobile/infrastructure/api-client";
import { credentialsStorage } from "#mobile/infrastructure/storage";
import { env } from "./env";
type User = Readonly<{ id: string; email: string; role: "admin" | "member" }>;
type Tokens = Readonly<{ accessToken: string; refreshToken: string; user: User }>;
type AuthContextValue = Readonly<{ user: User | null; ready: boolean; restoreSession(): Promise<void>; signIn(email: string, password: string): Promise<void>; signOut(): Promise<void> }>;
const AuthContext = createContext<AuthContextValue | null>(null);
const key = "auth.tokens";

function isTokens(value: unknown): value is Tokens {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<Tokens>;
  return typeof candidate.accessToken === "string"
    && typeof candidate.refreshToken === "string"
    && Boolean(candidate.user)
    && typeof candidate.user?.id === "string"
    && typeof candidate.user.email === "string"
    && (candidate.user.role === "admin" || candidate.user.role === "member");
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Tokens | null>(null);
  const [ready, setReady] = useState(false);
  const restoreSession = useCallback(async () => {
    setReady(false);
    try {
      const stored = await credentialsStorage.get(key);
      if (!stored) { setSession(null); return; }
      let parsed: unknown;
      try { parsed = JSON.parse(stored); }
      catch { await credentialsStorage.remove(key); setSession(null); return; }
      if (!isTokens(parsed)) { await credentialsStorage.remove(key); setSession(null); return; }
      setSession(parsed);
    } finally {
      setReady(true);
    }
  }, []);
  useEffect(() => { setAccessTokenProvider(async () => session?.accessToken ?? null); }, [session]);
  useEffect(() => { setTokenRefreshHandler(async () => { if (!session) return null; const response = await fetch(`${env.EXPO_PUBLIC_API_URL}/api/v1/auth/refresh`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken: session.refreshToken }) }); if (!response.ok) { await credentialsStorage.remove(key); setSession(null); return null; } const { data } = await response.json() as { data: Tokens }; await credentialsStorage.set(key, JSON.stringify(data)); setSession(data); return data.accessToken; }); }, [session]);
  const signIn = useCallback(async (email: string, password: string) => { const response = await fetch(`${env.EXPO_PUBLIC_API_URL}/api/v1/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) }); if (!response.ok) throw new Error("Sign in failed"); const { data } = await response.json() as { data: Tokens }; await credentialsStorage.set(key, JSON.stringify(data)); setSession(data); }, []);
  const signOut = useCallback(async () => { if (session) await fetch(`${env.EXPO_PUBLIC_API_URL}/api/v1/auth/logout`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken: session.refreshToken }) }); await credentialsStorage.remove(key); setSession(null); }, [session]);
  const value = useMemo(() => ({ user: session?.user ?? null, ready, restoreSession, signIn, signOut }), [ready, restoreSession, session, signIn, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() { const value = useContext(AuthContext); if (!value) throw new Error("useAuth must be used inside AuthProvider"); return value; }
