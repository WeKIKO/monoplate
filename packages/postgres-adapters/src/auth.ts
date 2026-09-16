import type { AuthRepository, Session, User, UserRole } from "@monoplate/auth";
import { sessions, users, type Database } from "@monoplate/database";
import { and, eq, gt, isNull } from "drizzle-orm";

export class DrizzleAuthRepository implements AuthRepository {
  constructor(private readonly database: Database) {}

  async findUserByEmail(email: string) {
    const [row] = await this.database.select().from(users).where(eq(users.email, email)).limit(1);
    return row as User | undefined;
  }

  async findUserById(id: string) {
    const [row] = await this.database.select().from(users).where(eq(users.id, id)).limit(1);
    return row as User | undefined;
  }

  async createUser(input: { email: string; passwordHash: string; role: UserRole }) {
    const [row] = await this.database.insert(users).values(input).returning();
    if (!row) throw new Error("User insert returned no row");
    return row as User;
  }

  async createSession(input: { userId: string; refreshTokenHash: string; expiresAt: Date }): Promise<Session> {
    const [row] = await this.database.insert(sessions).values(input).returning();
    const user = await this.findUserById(input.userId);
    if (!row || !user) throw new Error("Session insert failed");
    return { id: row.id, user: { id: user.id, email: user.email, role: user.role }, expiresAt: row.expiresAt };
  }

  async findSession(refreshTokenHash: string): Promise<Session | undefined> {
    const [row] = await this.database
      .select({ id: sessions.id, expiresAt: sessions.expiresAt, userId: users.id, email: users.email, role: users.role })
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.refreshTokenHash, refreshTokenHash), isNull(sessions.revokedAt), gt(sessions.expiresAt, new Date())))
      .limit(1);
    return row ? { id: row.id, expiresAt: row.expiresAt, user: { id: row.userId, email: row.email, role: row.role } } : undefined;
  }

  async revokeSession(refreshTokenHash: string) {
    await this.database.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.refreshTokenHash, refreshTokenHash));
  }
}
