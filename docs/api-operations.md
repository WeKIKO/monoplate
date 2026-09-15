# API operations

Stable product endpoints live under `/api/v1`; health, metrics, and OpenAPI are operational endpoints and remain unversioned. Breaking request or response changes require `/api/v2`. Additive fields are allowed in v1.

Every response carries `X-Request-Id`, `X-Trace-Id`, and `X-Api-Version`. JSON errors use the shared error registry. Collection endpoints should use `PaginationQuerySchema` and cursor pagination. Mutation callers may send an `Idempotency-Key`; successful JSON responses are replayed for 24 hours and reuse against a different method or path returns `409`.

The API applies configured CORS origins, secure headers, a one-megabyte default body limit, a 15-second timeout, and an in-process rate limiter. Replace the limiter with a shared Redis-compatible adapter before horizontally scaling untrusted public traffic.

Run `pnpm api:client:generate` after changing routes. `pnpm api:contract:check` fails when the committed OpenAPI document or generated TypeScript paths drift.
