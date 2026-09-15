import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AnalyticsConsentBanner, AsyncState, Button, FormField, FrontendProvider, useFrontend } from "@monoplate/ui";
import { StrictMode, useState, type FormEvent, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Link, Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./ui/ErrorBoundary";
import { apiRequest } from "./lib/api-client";
import "@monoplate/design-tokens/css";
import "@monoplate/ui/css";
import "./styles.css";

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 30_000 } } });
function AuthBoundary({ children }: { children: ReactNode }) { return sessionStorage.getItem("monoplate.admin.access-token") ? children : <Navigate to="/login" replace />; }
function Login() {
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); const values = new FormData(event.currentTarget); try { const response = await apiRequest<{ data: { accessToken: string; refreshToken: string } }>("/api/v1/auth/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: values.get("email"), password: values.get("password") }) }); sessionStorage.setItem("monoplate.admin.access-token", response.data.accessToken); localStorage.setItem("monoplate.admin.refresh-token", response.data.refreshToken); location.assign("/"); } catch { setError("Email or password is incorrect."); } }
  return <main id="content"><h1>Admin sign in</h1><form onSubmit={submit} noValidate><FormField label="Email" name="email" type="email" autoComplete="email" required /><FormField label="Password" name="password" type="password" autoComplete="current-password" minLength={12} required error={error || undefined} /><Button type="submit">Sign in</Button></form></main>;
}
function ThemeControl() { const { theme, setTheme } = useFrontend(); return <label className="theme-control">Theme<select aria-label="Color theme" value={theme} onChange={(event) => setTheme(event.target.value as "light" | "dark" | "system")}><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></label>; }
function Dashboard() {
  const health = useQuery({ queryKey: ["health"], queryFn: () => apiRequest<{ data: { status: string } }>("/health/ready") });
  return <main id="content"><nav aria-label="Primary"><strong>Monoplate</strong><Link to="/">Dashboard</Link><Link to="/settings">Settings</Link><Button onClick={() => { const refreshToken = localStorage.getItem("monoplate.admin.refresh-token"); if (refreshToken) void apiRequest("/api/v1/auth/logout", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ refreshToken }) }); sessionStorage.clear(); localStorage.removeItem("monoplate.admin.refresh-token"); location.assign("/login"); }}>Sign out</Button></nav><section><p className="eyebrow">OPERATIONS</p><h1>Admin dashboard</h1>{health.isPending ? <AsyncState status="loading" message="Checking API readiness…" /> : health.isError ? <AsyncState status="error" message="The API could not be reached." onRetry={() => void health.refetch()} /> : <div className="card">API readiness: <strong>{health.data?.data.status}</strong></div>}</section></main>;
}
function Settings() { return <main id="content"><nav><Link to="/">← Dashboard</Link></nav><section><h1>Settings</h1><p>Product-level administration belongs here.</p><ThemeControl /></section></main>; }
function App() { return <ErrorBoundary><FrontendProvider flags={{ adminSettings: true }}><a className="skip-link" href="#content">Skip to content</a><QueryClientProvider client={queryClient}><BrowserRouter><Routes><Route path="/login" element={<Login />} /><Route path="/" element={<AuthBoundary><Dashboard /></AuthBoundary>} /><Route path="/settings" element={<AuthBoundary><Settings /></AuthBoundary>} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></BrowserRouter></QueryClientProvider><AnalyticsConsentBanner /></FrontendProvider></ErrorBoundary>; }
createRoot(document.getElementById("root")!).render(<StrictMode><App /></StrictMode>);
