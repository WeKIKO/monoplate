# ADR 0001: Package-enforced modular monolith

- Status: Accepted
- Date: 2026-09-15

## Context

The template needs fast single-product delivery without coupling business rules to HTTP, persistence or framework SDKs. Starting with independently deployed services would increase operational and testing cost.

## Decision

Use one API deployment with bounded contexts under `domains/*`. Domain and application code depend on ports; Hono, Drizzle and vendor SDKs remain adapters. Public package exports and `pnpm check:architecture` enforce boundaries.

## Consequences

Transactions and local calls remain simple, while contexts can later be extracted. Teams must maintain explicit composition roots and cannot deep-import another context. A single deployment remains a shared failure and scaling boundary until deliberate extraction.
