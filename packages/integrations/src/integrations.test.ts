import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { LocalObjectStorage, signWebhook, verifyWebhookSignature } from "./node.js";
import { FakeBillingGateway, FakeEmailSender, InMemoryJobQueue, MemoryObjectStorage } from "./testing.js";
describe("integration adapters", () => {
  it("captures email without a provider", async () => { const email = new FakeEmailSender(); await email.send({ to: ["user@example.com"], subject: "Hello", text: "Welcome" }); expect(email.messages).toHaveLength(1); });
  it("stores files locally and prevents traversal", async () => { const root = await mkdtemp(join(tmpdir(), "monoplate-storage-")); const storage = new LocalObjectStorage(root); await storage.put("avatars/user.txt", new TextEncoder().encode("data"), "text/plain"); expect(new TextDecoder().decode(await storage.get("avatars/user.txt"))).toBe("data"); await expect(storage.get("../secret")).rejects.toThrow("escapes storage root"); await rm(root, { recursive: true, force: true }); });
  it("verifies webhook signatures in constant time", () => { const signature = signWebhook("payload", "secret"); expect(verifyWebhookSignature("payload", signature, "secret")).toBe(true); expect(verifyWebhookSignature("changed", signature, "secret")).toBe(false); });
  it("provides deterministic billing, storage, and job test doubles", async () => {
    const billing = new FakeBillingGateway();
    const checkout = await billing.createCheckout({ referenceId: "order-1", amount: 1200, currency: "KRW", successUrl: "https://example.com/success", cancelUrl: "https://example.com/cancel" });
    expect(checkout.url).toContain("order-1");
    const storage = new MemoryObjectStorage();
    await storage.put("invoice.txt", new TextEncoder().encode("paid"), "text/plain");
    expect(new TextDecoder().decode(await storage.get("invoice.txt"))).toBe("paid");
    const jobs = new InMemoryJobQueue();
    const handled = new Promise<string>((resolve) => jobs.register<{ orderId: string }>("receipt", async (job) => resolve(job.payload.orderId)));
    await jobs.enqueue("receipt", { orderId: "order-1" });
    await expect(handled).resolves.toBe("order-1");
  });
});
