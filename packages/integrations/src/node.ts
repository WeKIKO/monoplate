import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import type { EmailMessage, EmailSender, ObjectStorage, StoredObject } from "./ports.js";

export class ConsoleEmailSender implements EmailSender { async send(message: EmailMessage) { const messageId = randomUUID(); console.info(JSON.stringify({ event: "email.preview", messageId, to: message.to, subject: message.subject })); return { messageId }; } }
export class LocalObjectStorage implements ObjectStorage {
  readonly #root: string;
  constructor(root: string) { this.#root = resolve(root); }
  #path(key: string) { const path = resolve(this.#root, key); if (path !== this.#root && !path.startsWith(`${this.#root}${sep}`)) throw new Error("Object key escapes storage root"); return path; }
  async put(key: string, data: Uint8Array, contentType: string): Promise<StoredObject> { const path = this.#path(key); await mkdir(dirname(path), { recursive: true }); await writeFile(path, data); return { key, contentType, size: data.byteLength }; }
  async get(key: string) { try { return new Uint8Array(await readFile(this.#path(key))); } catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; } }
  async delete(key: string) { await rm(this.#path(key), { force: true }); }
  async createDownloadUrl(_key: string, _expiresInSeconds: number): Promise<string> { throw new Error("Local storage does not expose public URLs; serve files through an authenticated API route"); }
}
export function signWebhook(payload: string | Uint8Array, secret: string) { return createHmac("sha256", secret).update(payload).digest("hex"); }
export function verifyWebhookSignature(payload: string | Uint8Array, signature: string, secret: string) { const expected = Buffer.from(signWebhook(payload, secret), "hex"); let actual: Buffer; try { actual = Buffer.from(signature, "hex"); } catch { return false; } return actual.length === expected.length && timingSafeEqual(actual, expected); }
