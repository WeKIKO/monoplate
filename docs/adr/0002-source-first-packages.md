# ADR 0002: Source-first internal packages

- Status: Accepted
- Date: 2026-09-15

## Context

Publishing and independently compiling every internal package creates duplicate artifacts and ESM resolution failure modes for a private monorepo.

## Decision

Internal packages export TypeScript source. Each application compiles or bundles its workspace dependencies into its final artifact. Only application artifacts are deployed.

## Consequences

Local iteration and refactoring are direct, and package boundaries remain type-level and lint-enforced. Applications must support TypeScript workspace imports; consumers outside this repository cannot use these packages without a separate publishing decision.
