# 10. Commands

> All commands should be run from the root directory.
> Uses pnpm `9.12.1`.

## Environment Setup

```bash
# Set Node.js version (per .nvmrc)
nvm use

# Install dependencies
pnpm install

# Update dependencies (lockfile-based)
pnpm install --frozen-lockfile   # CI environment
```

## Local Development

```bash
# Full build (Turborepo analyzes dependency graph and builds in optimal order)
pnpm build

# Build specific package only
pnpm --filter @julong/mono-rele2-core build
pnpm --filter @julong/mono-rele2-utils build

# Watch mode
pnpm dev                          # turbo run dev

# Clean build (remove cache and dist)
pnpm clean

# Lint
pnpm lint                         # turbo run lint

# Format
pnpm format                       # turbo run format
```

## Type Checking

```bash
# Full type check
pnpm typecheck

# Specific package type check
pnpm --filter @julong/mono-rele2-core typecheck
pnpm --filter @julong/mono-rele2-utils typecheck
```

## Documentation Generation

```bash
# Update all package READMEs (requires bun, no build needed)
pnpm readme

# Update specific package README
pnpm --filter @julong/mono-rele2-core readme
```

## Documentation Site (Rspress)

```bash
# Start local dev server for documentation site
pnpm docs:dev                      # turbo run docs:dev

# Static build for documentation site (outputs to doc_build/)
pnpm docs:build                    # turbo run docs:build
```

The documentation site lives under `apps/site/` and runs on Rspress. Static docs are served from `apps/site/docs/` `.md` files, while package docs are auto-generated from `packages/*/README.md`.

## Tests

```bash
# Run all tests (47 tests with Rstest)
pnpm test
```

## Verification (Same Order as CI)

```bash
# 1. Type check
pnpm typecheck

# 2. Build
pnpm build

# 3. Test
pnpm test

# 4. Release dry-run
pnpm exec multi-semantic-release --dry-run
```

## MCP Server Execution

```bash
# Run directly via npx (published version)
npx @julong/mono-rele2-core
npx @julong/mono-rele2-utils

# Run local build (development)
node packages/core/dist/server.js
node packages/utils/dist/server.js

# Debug with MCP Inspector
npx @modelcontextprotocol/inspector node packages/core/dist/server.js
npx @modelcontextprotocol/inspector node packages/utils/dist/server.js

# MCP Client Config (with env variable example)
# @julong/mono-rele2-utils supports passing API_KEY environment variable
# MCP client config.json:
# {
#   "mcpServers": {
#     "@julong/mono-rele2-utils": {
#       "command": "npx",
#       "args": ["-y", "@julong/mono-rele2-utils"],
#       "env": { "API_KEY": "<value>" }
#     }
#   }
# }
```

## CLI Tool Execution

```bash
# List tools
npx @julong/mono-rele2-core-cli
npx @julong/mono-rele2-utils-cli

# Run specific tools (core)
npx @julong/mono-rele2-core-cli echoTool "hello world"
npx @julong/mono-rele2-core-cli timestampTool unix
npx @julong/mono-rele2-core-cli envTool HOME
npx @julong/mono-rele2-core-cli uuidTool

# Run specific tools (utils)
npx @julong/mono-rele2-utils-cli cnTool '["btn","active"]'
npx @julong/mono-rele2-utils-cli caseConvertTool "hello world" camel
npx @julong/mono-rele2-utils-cli truncateTool "hello world" 8
npx @julong/mono-rele2-utils-cli objectFlattenTool '{"user":{"name":"Alice"}}'
npx @julong/mono-rele2-utils-cli getUserTool '{"name":{"first":"Alice","last":"Kim"},"location":{"city":"Seoul"}}'
npx @julong/mono-rele2-utils-cli envGetTool '["API_KEY"]'

# Run CLI from local build
node packages/core/dist/cli.js echoTool "hello world"
node packages/utils/dist/cli.js cnTool '["btn","active"]'
```

## Git Commits

```bash
# feat: new feature (minor release)
git commit -m "feat(scope): add new feature"

# fix: bug fix (patch release)
git commit -m "fix(scope): resolve null reference"

# BREAKING CHANGE (major release)
git commit -m "feat(scope)!: rename public API"
# Or specify BREAKING CHANGE in footer
git commit -m "feat(scope): rename public API

BREAKING CHANGE: oldName has been renamed to newName"

# Documentation/config changes (no release)
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
git commit -m "refactor(scope): restructure module"
```

## Package Publishing

```bash
# Actual release (GitHub Actions auto-runs when pushing to main)
git push origin main

# Manual dry-run (check results without actual publish)
pnpm exec multi-semantic-release --dry-run
```

## Bundle Analysis

```bash
# Check built bundle contents
ls packages/core/dist/
ls packages/utils/dist/

# Check generated skill documents
ls packages/core/dist/skills/
ls packages/utils/dist/skills/

# Check documentation site build output
ls apps/site/doc_build/
```

## Troubleshooting

```bash
# Clear Turbo cache
rm -rf .turbo
pnpm build --force

# pnpm store issues
pnpm store prune
rm -rf node_modules
pnpm install

# Full cleanup
pnpm clean && rm -rf node_modules .turbo && pnpm install && pnpm build
```
