import { z } from "zod";
export const AdminEnvSchema = z.object({ VITE_API_URL: z.url().default("http://localhost:3000"), VITE_APP_ENV: z.enum(["development", "preview", "production"]).default("development") });
export type AdminEnv = z.infer<typeof AdminEnvSchema>;
export function parseAdminEnv(input: Record<string, unknown>): AdminEnv { return AdminEnvSchema.parse(input); }
