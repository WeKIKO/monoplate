# ADR 0003: Single-tenant authentication

- Status: Accepted
- Date: 2026-09-15

## Context

The product is explicitly single-tenant. Tenant identifiers and row-scoping would add misleading complexity and an incomplete security boundary.

## Decision

Users have `admin` or `member` roles. Password hashing and JWT issuance are adapters, refresh sessions are revocable database records, and bootstrap credentials are used only to create the initial administrator.

## Consequences

Authorization stays small and auditable. Converting to multi-tenancy is a product migration requiring schema ownership, tenant-aware uniqueness, authorization, jobs, storage, observability and data migration; it is not a configuration toggle.
