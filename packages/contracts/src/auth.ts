import { z } from "zod";
export const UserRoleSchema = z.enum(["admin", "member"]);
export const PublicUserSchema = z.object({ id: z.uuid(), email: z.email(), role: UserRoleSchema });
export const LoginRequestSchema = z.object({ email: z.email(), password: z.string().min(12).max(200) });
export const RefreshRequestSchema = z.object({ refreshToken: z.string().min(32) });
export const AuthResponseSchema = z.object({ data: z.object({ accessToken: z.string(), refreshToken: z.string(), user: PublicUserSchema }) });
export const MeResponseSchema = z.object({ data: PublicUserSchema });
export const LogoutResponseSchema = z.object({ data: z.object({ success: z.literal(true) }) });
