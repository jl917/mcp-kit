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
| **multi-semantic-release** | Monorepo semantic-release (per-package independent versioning) |
| **semantic-release/commit-analyzer** | Conventional Commits-based version determination |
| **semantic-release/changelog** | Auto-generates CHANGELOG.md |
| **semantic-release/npm** | Auto-publishes to npm |
| **semantic-release/git** | Creates version tags |
| **semantic-release/github** | Creates GitHub Releases |

## Release Rules (`.releaserc.json`)

| Commit Type | Version Bump |
|-------------|--------------|
| `feat` | minor (`1.x.0`) |
| `fix` | patch (`1.0.x`) |
| `perf` | patch (`1.0.x`) |
| `revert` | patch (`1.0.x`) |
| `BREAKING CHANGE` (footer) | major (`x.0.0`) |
| `docs`, `chore`, `refactor`, `test` | No release |

## Currently Unused

- **Linter**: No ESLint configured
- **Formatter**: Prettier configured
- **Test framework**: Vitest, Jest, etc. not configured yet
- **Test files**: `*.test.ts` files exist (Rstest)
- **UI framework**: React, Next.js, etc. not used (MCP server only)
- **Database**: Not used
- **HTTP server**: Not used (MCP stdio transport only)
