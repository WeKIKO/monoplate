export type UserRole = "admin" | "member";
export type User = Readonly<{ id: string; email: string; passwordHash: string; role: UserRole }>;
export type PublicUser = Omit<User, "passwordHash">;
export type Session = Readonly<{ id: string; user: PublicUser; expiresAt: Date }>;
export type AuthTokens = Readonly<{ accessToken: string; refreshToken: string; user: PublicUser }>;
export const permissions = { admin: ["admin:read", "admin:write"], member: ["profile:read"] } as const satisfies Record<UserRole, readonly string[]>;
export function hasPermission(role: UserRole, permission: string) { return (permissions[role] as readonly string[]).includes(permission); }
