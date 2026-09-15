# Security policy

Report vulnerabilities privately through the repository security advisory flow. Do not open a public issue containing credentials, exploit details, or personal data.

Supported releases are the latest tagged release and the current `release` branch. Rotate exposed secrets immediately, revoke affected sessions, preserve request/trace identifiers, and follow `docs/observability.md` during incident response.

## Local checks

Run `pnpm security:check` before opening a pull request. It rejects likely committed credentials and fails on high or critical dependency advisories. `pnpm security:sbom` creates an ignored CycloneDX SBOM at `sbom.json`.

The security workflow also runs dependency review, CodeQL, Trivy image scanning, and uploads the SBOM. Third-party GitHub Actions are pinned to full commit SHAs; Dependabot proposes version and SHA updates weekly.
