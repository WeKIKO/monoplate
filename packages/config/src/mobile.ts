import { z } from "zod";
export const MobileEnvSchema = z.object({
  EXPO_PUBLIC_API_URL: z.url().default("http://localhost:3000"),
  EXPO_PUBLIC_APP_ENV: z.enum(["development", "preview", "production"]).default("development"),
  EXPO_PUBLIC_SENTRY_DSN: z.preprocess((value) => value === "" ? undefined : value, z.url().optional()),
  EXPO_PUBLIC_DEV_HOST: z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional()),
  EXPO_PUBLIC_MINIMUM_APP_VERSION: z.string().regex(/^\d+\.\d+\.\d+$/).default("0.1.0"),
  EXPO_PUBLIC_RECOMMENDED_APP_VERSION: z.preprocess((value) => value === "" ? undefined : value, z.string().regex(/^\d+\.\d+\.\d+$/).optional()),
  EXPO_PUBLIC_APP_STORE_URL: z.preprocess((value) => value === "" ? undefined : value, z.url().optional()),
});
export type MobileEnv = z.infer<typeof MobileEnvSchema>;
export function parseMobileEnv(input: Record<string, unknown>): MobileEnv { return MobileEnvSchema.parse(input); }
