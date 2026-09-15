export type ThemeMode = "light" | "dark" | "system";

export function resolveTheme(mode: ThemeMode, systemIsDark: boolean): "light" | "dark" {
  return mode === "system" ? (systemIsDark ? "dark" : "light") : mode;
}

export type FeatureFlags = Readonly<Record<string, boolean>>;

export function isFeatureEnabled(flags: FeatureFlags, name: string, fallback = false): boolean {
  return flags[name] ?? fallback;
}

export type AnalyticsConsent = "unknown" | "granted" | "denied";
export const ANALYTICS_CONSENT_KEY = "monoplate.analytics-consent";

export function canTrack(consent: AnalyticsConsent, doNotTrack: string | null = null): boolean {
  return consent === "granted" && doNotTrack !== "1";
}

export interface FormatContext {
  locale: string;
  timeZone: string;
}

export function formatDate(value: Date | string | number, context: FormatContext, options: Intl.DateTimeFormatOptions = {}): string {
  return new Intl.DateTimeFormat(context.locale, { timeZone: context.timeZone, dateStyle: "medium", ...options }).format(new Date(value));
}

export function formatDateTime(value: Date | string | number, context: FormatContext): string {
  return formatDate(value, context, { dateStyle: "medium", timeStyle: "short" });
}

export type AppDeepLink =
  | { route: "home" }
  | { route: "settings" }
  | { route: "resource"; id: string };

export function appPath(link: AppDeepLink): string {
  if (link.route === "home") return "/";
  if (link.route === "settings") return "/settings";
  return `/resources/${encodeURIComponent(link.id)}`;
}

export function webDeepLink(origin: string, link: AppDeepLink): string {
  return new URL(appPath(link), origin).toString();
}

/** Standard Schema compatible validator used by both form libraries and server contracts. */
export interface FormSchema<T> {
  readonly "~standard": {
    readonly validate: (value: unknown) => { value: T } | { issues: ReadonlyArray<{ message: string; path?: ReadonlyArray<PropertyKey | { key: PropertyKey }> }> } | Promise<{ value: T } | { issues: ReadonlyArray<{ message: string; path?: ReadonlyArray<PropertyKey | { key: PropertyKey }> }> }>;
  };
}

export type FormErrors = Record<string, string>;

export async function validateForm<T>(schema: FormSchema<T>, input: unknown): Promise<{ data: T; errors: FormErrors } | { data: null; errors: FormErrors }> {
  const result = await schema["~standard"].validate(input);
  if ("value" in result) return { data: result.value, errors: {} };
  const errors: FormErrors = {};
  for (const issue of result.issues) {
    const segment = issue.path?.[0];
    const key = typeof segment === "object" && segment !== null ? segment.key : segment;
    errors[String(key ?? "form")] ??= issue.message;
  }
  return { data: null, errors };
}
