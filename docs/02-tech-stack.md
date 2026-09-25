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
| `systeminformation` | `^5.33.13` | Reads battery, memory, CPU load, and filesystem usage of the host |

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
- Code splitting with `splitting: true`, and `treeshake: true` so rollup performs the CJS conversion
- Every dependency is inlined except `playwright` (`noExternal: [/^(?!playwright)/]`)
- `playwright` stays **external** — it resolves browser drivers from its own package directory at runtime and cannot be bundled
- The ESM output carries a `require` shim in its banner (`esbuildOptions`) — see below
- Minify enabled
- `define` injects `package.json`'s `version` (read by `src/common/constants.ts`, reported in the MCP `initialize` response) and the build environment's TMDB credentials (see below)
- 3 entry points: `src/index.ts`, `src/server.ts`, `src/cli.ts`
- Post-build: shebangs added to the `server`/`cli` bundles, empty chunks removed, and in `dev` the `skills/<bin>/SKILL.md` and README are regenerated

### Why `treeshake: true` Is Not Optional

Without it, tsup converts the CJS output by running sucrase over the already-minified esbuild
bundle. Sucrase rewrites `return(await x)?.y ?? z` — the shape minification produces — into
`returnawait _asyncNullishCoalesce(...)`, with the space dropped, and every `dist/*.cjs` fails to
parse. `treeshake: true` hands CJS code splitting to rollup instead and the sucrase pass never
runs. The `Smoke test the built bundles` step in CI loads the output so this cannot ship unnoticed.

### Why the ESM Output Needs a `require` Shim

`noExternal` inlines every dependency, and some of them ship as CommonJS — `systeminformation`
calls `require('os')` and `require('child_process')` inside its own modules. esbuild leaves those
calls as "use `require` if the runtime has one, otherwise throw", and ESM has none, so importing the
bundle died on `Dynamic require of "os" is not supported` before any tool ran. `esbuildOptions` adds
a banner to the **ESM format only** that builds a `require` from `node:module`:

```js
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);
```

The CJS output already has a real `require`, and declaring another one there would collide, which is
why the banner is keyed off `context.format`. Marking the builtins `external` does not help —
`noExternal: [/^(?!playwright)/]` matches bare names like `os` too and wins over `external`.

### Build-Time TMDB Credentials

`tsup.config.ts` reads `TMDB_API_KEY` / `TMDB_ACCESS_TOKEN` from the build environment (and from a
local `.env`) and replaces the `__TMDB_API_KEY__` / `__TMDB_ACCESS_TOKEN__` / `__TMDB_SEAL_SECRET__`
identifiers in `src/tmdb/embedded.ts` with string literals. A build made with a credential runs the
movie tools without one being supplied at startup; a build made without one behaves exactly as
before and reads the environment at call time. The build prints which variables it embedded.

The value is sealed with AES-256-GCM under a secret generated fresh for each build, and
`src/tmdb/embedded.ts` owns both halves of the format so the build and the runtime cannot drift
apart. **This is obfuscation, not encryption** — the secret ships in the same bundle, so anyone
holding the bundle can open the value. What it buys is narrow and worth stating plainly:

- the key is not a greppable string in `dist/`, so automated secret scanners and casual inspection
  do not surface it
- pasting a fragment of the bundle into an issue or a log does not leak the credential

It does not make the credential safe to distribute.

The `Build` step in `.github/workflows/release.yml` passes the repository secrets, so **the package
published to npm carries a TMDB credential** and `npx @julong/mcp-kit` works with nothing in the
client config. Everyone who installs the package can recover that key, so the secret behind it must
be a dedicated key issued for public use — not a personal one, and not one shared with anything
else. If it is abused, issue a new one at TMDB and replace the repository secret; the next release
picks it up. A `Verify the credential made it into the bundle` step fails the release if the secret
is missing, so a keyless package cannot be published by accident.

`ci.yml` passes the same secrets so the embedding path is exercised on every run, but it asserts
nothing — pull requests from a fork receive no secrets and correctly produce a build without one.

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
| **GitHub Actions** | CI and Release workflows |
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
