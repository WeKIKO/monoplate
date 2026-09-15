import { parseServerEnv } from "@monoplate/config/server";
import { createDatabaseConnection, requireDatabaseUrl } from "@monoplate/database";
import { DrizzleAuthRepository } from "./modules/auth/infrastructure/drizzle-auth-repository.js";
import { NodePasswordHasher } from "./modules/auth/infrastructure/node-password-hasher.js";

const env = parseServerEnv();
if (!env.AUTH_BOOTSTRAP_EMAIL || !env.AUTH_BOOTSTRAP_PASSWORD) throw new Error("AUTH_BOOTSTRAP_EMAIL and AUTH_BOOTSTRAP_PASSWORD are required");
const connection = createDatabaseConnection(requireDatabaseUrl());
try {
  const repository = new DrizzleAuthRepository(connection.db);
  const email = env.AUTH_BOOTSTRAP_EMAIL.toLowerCase();
  if (await repository.findUserByEmail(email)) throw new Error(`User already exists: ${email}`);
  const passwordHash = await new NodePasswordHasher().hash(env.AUTH_BOOTSTRAP_PASSWORD);
  const user = await repository.createUser({ email, passwordHash, role: "admin" });
  console.log(`Created admin user ${user.email}`);
} finally { await connection.close(); }
