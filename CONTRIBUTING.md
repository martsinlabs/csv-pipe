# Contributing

Thanks for considering a contribution. This guide covers the setup and the
conventions the project follows.

By taking part, you agree to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).
To report a vulnerability, follow the [Security Policy](SECURITY.md) instead of
opening a public issue.

## Setup

Requires Node 18 or newer.

```
npm install
```

## Scripts

| Script                  | What it does                                         |
| ----------------------- | ---------------------------------------------------- |
| `npm test`              | Run the test suite once                              |
| `npm run test:watch`    | Run the tests in watch mode                          |
| `npm run coverage`      | Run the tests with coverage                          |
| `npm run typecheck`     | Type-check with no emit                              |
| `npm run lint`          | Lint with ESLint                                     |
| `npm run format`        | Format with Prettier                                 |
| `npm run build`         | Build the bundles and declarations                   |
| `npm run smoke`         | Run the built bundle's cross-runtime smoke test      |
| `npm run size`          | Build and check the bundle-size budget               |
| `npm run bench`         | Run the encoding benchmarks                          |
| `npm run check:package` | Build, then verify the package with publint and attw |

## Conventions

- TypeScript in strict mode. No `any` in the public surface.
- Names are concise but whole words; no single-letter identifiers.
- Prettier owns formatting; run `npm run format` before committing.
- Commit messages follow Conventional Commits.

## Releasing

Releases are cut from a git tag. To publish a new version:

1. Update `CHANGELOG.md` with the notable changes.
2. Bump the version and create the tag:

   ```
   npm version <patch | minor | major>
   ```

3. Push the commit and the tag:

   ```
   git push --follow-tags
   ```

Pushing a `v*` tag triggers the release workflow, which verifies the package and
publishes it to npm with provenance. The tag must match the version in
`package.json`, or the workflow fails.

## Pull request checklist

- Tests pass and cover the change.
- `npm run typecheck`, `npm run lint`, and `npm run format:check` are clean.
- The README and CHANGELOG are updated when public behavior changes.
