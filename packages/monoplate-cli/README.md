# @xierra/monoplate-cli

Public scaffolding CLI for the [Monoplate](https://github.com/WeKIKO/monoplate) TypeScript monorepo template.

```bash
npx @xierra/monoplate-cli@latest new happy
```

The CLI clones the public template over HTTPS, creates a fresh Git repository, installs dependencies, and runs the version-matched initializer contained in that template checkout.

```bash
npx @xierra/monoplate-cli@latest new happy \
  --namespace=happy \
  --display-name="Happy" \
  --primary-color="#FF6B35" \
  --secondary-color="#2563EB" \
  --tertiary-color="#10B981"
```

The primary color is a Material 3 seed. Secondary, tertiary, and error seeds are optional; omitted values are derived from primary. The template generates accessible light and dark semantic colors including containers, surfaces, outlines, inverse colors, and on-colors.

Run `npx @xierra/monoplate-cli@latest --help` for every option.

## Publishing

Publishing is handled by the repository's `publish-cli.yml` workflow when a `cli-v*` tag is pushed. Configure the npm trusted publisher for `WeKIKO/monoplate` and that workflow, or add an `NPM_TOKEN` repository secret.
