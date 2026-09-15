import { createContext, useCallback, useContext, useEffect, useId, useMemo, useRef, useState, type ButtonHTMLAttributes, type DialogHTMLAttributes, type InputHTMLAttributes, type ReactNode } from "react";
import { ANALYTICS_CONSENT_KEY, resolveTheme, type AnalyticsConsent, type FeatureFlags, type FormatContext, type ThemeMode } from "./core.js";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={`mp-button ${className}`} {...props} />;
}

export function FormField({ label, error, hint, id: suppliedId, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | undefined; hint?: string | undefined }) {
  const generatedId = useId();
  const id = suppliedId ?? generatedId;
  const descriptionId = `${id}-description`;
  return <label className="mp-field" htmlFor={id}><span>{label}</span><input id={id} aria-invalid={Boolean(error)} aria-describedby={error || hint ? descriptionId : undefined} {...props} />{error ? <span id={descriptionId} className="mp-field-error" role="alert">{error}</span> : hint ? <span id={descriptionId} className="mp-field-hint">{hint}</span> : null}</label>;
}

export type AsyncStatus = "loading" | "empty" | "error";
export function AsyncState({ status, title, message, onRetry }: { status: AsyncStatus; title?: string; message?: string; onRetry?: () => void }) {
  if (status === "loading") return <div className="mp-state" role="status" aria-live="polite"><span className="mp-spinner" aria-hidden="true" />{message ?? "Loading…"}</div>;
  return <section className="mp-state" role={status === "error" ? "alert" : "status"}><h2>{title ?? (status === "empty" ? "Nothing here yet" : "Something went wrong")}</h2>{message ? <p>{message}</p> : null}{status === "error" && onRetry ? <Button type="button" onClick={onRetry}>Try again</Button> : null}</section>;
}

export function Dialog({ open, title, children, onClose, ...props }: DialogHTMLAttributes<HTMLDialogElement> & { open: boolean; title: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const dialog = ref.current; if (!dialog) return; if (open && !dialog.open) dialog.showModal(); else if (!open && dialog.open) dialog.close(); }, [open]);
  return <dialog ref={ref} aria-labelledby={titleId} onCancel={onClose} onClose={onClose} {...props}><h2 id={titleId}>{title}</h2>{children}<Button type="button" onClick={onClose}>Close</Button></dialog>;
}

type Toast = { id: number; message: string; tone: "info" | "success" | "error" };
const ToastContext = createContext<((message: string, tone?: Toast["tone"]) => void) | null>(null);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const notify = useCallback((message: string, tone: Toast["tone"] = "info") => { const id = Date.now() + Math.random(); setToasts((items) => [...items, { id, message, tone }]); window.setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 4_000); }, []);
  return <ToastContext.Provider value={notify}>{children}<div className="mp-toasts" aria-live="polite" aria-atomic="false">{toasts.map((toast) => <div key={toast.id} className={`mp-toast mp-toast-${toast.tone}`} role={toast.tone === "error" ? "alert" : "status"}>{toast.message}<button aria-label="Dismiss notification" onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}>×</button></div>)}</div></ToastContext.Provider>;
}
export function useToast() { const value = useContext(ToastContext); if (!value) throw new Error("useToast must be used inside ToastProvider"); return value; }

type FrontendContextValue = { theme: ThemeMode; setTheme: (theme: ThemeMode) => void; format: FormatContext; flags: FeatureFlags; consent: AnalyticsConsent; setConsent: (value: Exclude<AnalyticsConsent, "unknown">) => void };
const FrontendContext = createContext<FrontendContextValue | null>(null);
export function FrontendProvider({ children, flags = {}, defaultLocale, defaultTimeZone }: { children: ReactNode; flags?: FeatureFlags; defaultLocale?: string; defaultTimeZone?: string }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => (localStorage.getItem("monoplate.theme") as ThemeMode | null) ?? "system");
  const [consent, setConsentState] = useState<AnalyticsConsent>(() => (localStorage.getItem(ANALYTICS_CONSENT_KEY) as AnalyticsConsent | null) ?? "unknown");
  useEffect(() => { const media = matchMedia("(prefers-color-scheme: dark)"); const apply = () => { document.documentElement.dataset.theme = resolveTheme(theme, media.matches); document.documentElement.style.colorScheme = resolveTheme(theme, media.matches); }; apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply); }, [theme]);
  const setTheme = useCallback((value: ThemeMode) => { localStorage.setItem("monoplate.theme", value); setThemeState(value); }, []);
  const setConsent = useCallback((value: Exclude<AnalyticsConsent, "unknown">) => { localStorage.setItem(ANALYTICS_CONSENT_KEY, value); setConsentState(value); }, []);
  const format = useMemo(() => ({ locale: defaultLocale ?? navigator.language, timeZone: defaultTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone }), [defaultLocale, defaultTimeZone]);
  return <FrontendContext.Provider value={{ theme, setTheme, format, flags, consent, setConsent }}><ToastProvider>{children}</ToastProvider></FrontendContext.Provider>;
}
export function useFrontend() { const value = useContext(FrontendContext); if (!value) throw new Error("useFrontend must be used inside FrontendProvider"); return value; }

export function AnalyticsConsentBanner() {
  const { consent, setConsent } = useFrontend();
  if (consent !== "unknown") return null;
  return <aside className="mp-consent" aria-label="Analytics consent"><p>Allow privacy-conscious analytics to help improve the product?</p><div><Button onClick={() => setConsent("granted")}>Allow</Button><Button className="mp-button-secondary" onClick={() => setConsent("denied")}>Decline</Button></div></aside>;
}
