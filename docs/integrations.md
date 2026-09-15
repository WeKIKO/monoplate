# External service adapters

`@monoplate/integrations` defines provider-neutral ports for email, object storage, billing, and background jobs. Domain and application code depend on these interfaces; an application composition root selects the concrete adapter.

## Included adapters

- `FakeEmailSender` records messages for assertions.
- `MemoryObjectStorage` keeps objects in memory for tests.
- `FakeBillingGateway` creates deterministic fake customers and subscriptions.
- `InMemoryJobQueue` dispatches registered handlers on the next microtask for tests or local development.
- `ConsoleEmailSender` writes delivery metadata without message bodies.
- `LocalObjectStorage` stores development files under a configured directory and rejects path traversal.
- `signWebhook` and `verifyWebhookSignature` provide HMAC-SHA256 helpers with constant-time comparison.

Import contracts from `@monoplate/integrations`, test doubles from `@monoplate/integrations/testing`, and Node-only adapters from `@monoplate/integrations/node`. Do not use the in-memory queue as a production queue: jobs disappear when the process exits and cannot be claimed safely by multiple workers.

When adding a vendor, implement the existing port in this package or a dedicated adapter package. Keep SDK types and webhook payloads inside the adapter boundary, map failures to application errors, make webhook processing idempotent, and verify signatures before parsing or dispatching events.
