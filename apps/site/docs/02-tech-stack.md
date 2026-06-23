# 2. Tech Stack

## Framework & Language

| Item | Version | Description |
|------|---------|-------------|
| Node.js | `>=24.10.0` (per `.nvmrc`) | Runtime |
| TypeScript | `^5.6.3` | Language |
| pnpm | `9.12.1` | Package manager |
| Turbo | `^2.3.3` | Monorepo build orchestration |

## Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | `^1.29.0` | MCP server implementation (Server, StdioServerTransport, CallToolResult, etc.) |
| `zod` | `^4.4.2` | Tool input schema definition and runtime validation |

## Documentation Site

| Tool | Version | Purpose |
|------|---------|---------|
| **Rspress** (`@rspress/core`) | `^2.0.12` | Documentation site framework (Vite/Rspack-based) |
| **@rspress/plugin-llms** | `^2.0.12` | Auto-generates llms.txt / llms-full.txt |
| **Netlify** | `netlify-cli ^26.0.2` | Documentation site deployment |

`apps/site/scripts/package-docs-plugin.ts` — Custom Rspress plugin that dynamically converts package READMEs into documentation pages

## Build & Bundling

| Tool | Purpose |
|------|---------|
| **tsup** (`^8.5.1`) | TypeScript → ESM bundling, dts generation, minify |
| **Turbo** (`^2.3.3`) | Monorepo task execution, build caching, dependency graph management |

Common bundling config (`packages/common/build/tsup.config.mjs`):
- ESM + CJS format
- Code splitting with `splitting: true`
- All dependencies bundled via `noExternal: [/./]`
- Minify enabled
- Each package has 3 entry points: `index.ts`, `server.ts`, `cli.ts`

## CI/CD

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI, Auto PR, Release workflows |
| **release-please** (`googleapis/release-please-action@v4`) | Monorepo release automation (per-package independent versioning via release PR) |
| Conventional Commits | Drives version determination (`feat`/`fix`/`BREAKING CHANGE`) |
| release-please CHANGELOG | Auto-generates per-package CHANGELOG.md |
| `pnpm -r publish` | Publishes to npm (in the `publish` job, after release PR merge) |
| release-please tags | Creates version tags (`<package-name>@<version>`) |
| release-please releases | Creates GitHub Releases |

## Release Rules (`release-please-config.json` + `.release-please-manifest.json`)

Versioning is driven by [Conventional Commits](https://www.conventionalcommits.org/). Instead of releasing immediately on push to `main`, release-please opens/updates a **release PR** with version bumps and CHANGELOG entries; merging that PR creates the tags, GitHub Releases, and triggers npm publish. Current versions per package are tracked in `.release-please-manifest.json`.

Key `release-please-config.json` options: `release-type: "node"`, `include-component-in-tag: true`, `include-v-in-tag: false`, `separator: "@"` (tags stay in the `<package-name>@<version>` format, e.g. `@julong/mono-rele2-core@1.34.0`), `plugins: ["node-workspace"]`, with a `packages` map covering `packages/core`, `packages/utils`, and `apps/site`.

| Commit Type | Version Bump |
|-------------|--------------|
| `feat` | minor (`1.x.0`) |
| `fix` | patch (`1.0.x`) |
| `perf` | patch (`1.0.x`) |
| `revert` | patch (`1.0.x`) |
| `BREAKING CHANGE` (footer) | major (`x.0.0`) |
| `docs`, `chore`, `refactor`, `test`, `build`, `ci`, `style` | No release |

## Currently Unused

- **Linter**: No ESLint configured
- **Formatter**: Prettier configured
- **Test framework**: Vitest, Jest, etc. not configured yet
- **Test files**: `*.test.ts` files exist (Rstest)
- **UI framework**: React, Next.js, etc. not used (MCP server only)
- **Database**: Not used
- **HTTP server**: Not used (MCP stdio transport only)
