import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import type { PasswordHasher } from "@monoplate/auth";
const scrypt = promisify(nodeScrypt);
export class NodePasswordHasher implements PasswordHasher {
  async hash(password: string) { const salt = randomBytes(16).toString("hex"); const digest = await scrypt(password, salt, 64) as Buffer; return `scrypt$${salt}$${digest.toString("hex")}`; }
  async verify(password: string, encoded: string) { const [algorithm, salt, digest] = encoded.split("$"); if (algorithm !== "scrypt" || !salt || !digest) return false; const candidate = await scrypt(password, salt, 64) as Buffer; const expected = Buffer.from(digest, "hex"); return candidate.length === expected.length && timingSafeEqual(candidate, expected); }
}
