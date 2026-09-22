# 2. Tech Stack

## Framework & Language

| Item | Version | Description |
|------|---------|-------------|
| Node.js | `>=24.10.0` (per `.nvmrc`) | Runtime |
| TypeScript | `^5.6.3` | Language |
| pnpm | `9.12.1` | Package manager |

## Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@modelcontextprotocol/sdk` | `^1.29.0` | MCP server implementation (Server, StdioServerTransport, CallToolResult, etc.) |
| `zod` | `^4.4.2` | Tool input schema definition and runtime validation |
| `playwright` | `^1.50.0` | Scraping engine that opens each portal page to read rates |

## Documentation Site

| Tool | Version | Purpose |
|------|---------|---------|
| **Rspress** (`@rspress/core`) | `^2.0.12` | Documentation site framework (Vite/Rspack-based) |
| **@rspress/plugin-llms** | `^2.0.12` | Auto-generates llms.txt / llms-full.txt |
| **Netlify** | `netlify-cli ^26.0.2` | Documentation site deployment |

`scripts/readme-docs-plugin.ts` — Custom Rspress plugin that renders the generated root README as the `/api` documentation page

## Build & Bundling

| Tool | Purpose |
|------|---------|
| **tsup** (`^8.5.1`) | TypeScript → ESM/CJS bundling, dts generation, minify |

Bundling config (`tsup.config.ts`):
- ESM + CJS format
- Code splitting with `splitting: true`
- Every dependency is inlined except `playwright` (`noExternal: [/^(?!playwright)/]`)
- `playwright` stays **external** — it resolves browser drivers from its own package directory at runtime and cannot be bundled
- Minify enabled
- 3 entry points: `src/index.ts`, `src/server.ts`, `src/cli.ts`
- Post-build: shebangs added to the `server`/`cli` bundles, empty chunks removed, and in `dev` the `skills/<bin>/SKILL.md` and README are regenerated

## Code Quality & Testing

| Tool | Version | Purpose |
|------|---------|---------|
| **Rslint** (`@rslint/core`) | `^0.5.3` | Linting (`rslint.config.ts`) |
| **Prettier** | `^3.5.3` | Formatting (`.prettierrc`) |
| **Rstest** (`@rstest/core`) | `^0.10.3` | Test runner + v8 coverage (`rstest.config.ts`) |
| **Bun** | `^1.2.0` | Lets `scripts/update-readme.mjs` import TypeScript directly |

## Agent Tests (optional)

`src/agent.test.ts` calls a real LLM and the real portals. It is skipped by the default `pnpm test` and runs only via `pnpm test:agent`.

| Package | Purpose |
|---------|---------|
| `@langchain/core`, `@langchain/openai`, `@langchain/mcp-adapters`, `langchain` | LLM / MCP adapters |
| `deepagents` | Agent loop |

## CI/CD

| Tool | Purpose |
|------|---------|
| **GitHub Actions** | CI, Auto PR, Release workflows |
| **release-please** (`googleapis/release-please-action@v4`) | Release automation (single-package versioning via release PR) |
| Conventional Commits | Drives version determination (`feat`/`fix`/`BREAKING CHANGE`) |
| release-please CHANGELOG | Auto-generates the root CHANGELOG.md |
| `pnpm publish` | Publishes to npm (in the `publish` job, after release PR merge) |
| release-please tags | Creates version tags (`v<version>`) |
| release-please releases | Creates GitHub Releases |

## Release Rules (`release-please-config.json` + `.release-please-manifest.json`)

Versioning is driven by [Conventional Commits](https://www.conventionalcommits.org/). Instead of releasing immediately on push to `main`, release-please opens/updates a **release PR** with version bumps and CHANGELOG entries; merging that PR creates the tag, GitHub Release, and triggers npm publish. The current version is tracked in `.release-please-manifest.json`.

Key `release-please-config.json` options: `release-type: "node"`, `include-component-in-tag: false`, `include-v-in-tag: true` (tags use the `v<version>` format, e.g. `v1.0.0`), with a `packages` map covering only the repository root (`{ ".": {} }`).

| Commit Type | Version Bump |
|-------------|--------------|
| `feat` | minor (`1.x.0`) |
| `fix` | patch (`1.0.x`) |
| `perf` | patch (`1.0.x`) |
| `revert` | patch (`1.0.x`) |
| `BREAKING CHANGE` (footer) | major (`x.0.0`) |
| `docs`, `chore`, `refactor`, `test`, `build`, `ci`, `style` | No release |

## Currently Unused

- **Monorepo tooling**: No Turborepo or pnpm workspace (single repository, single package)
- **UI framework**: React, Next.js, etc. not used (MCP server only)
- **Database**: Not used
- **HTTP server**: Not used (MCP stdio transport only)
