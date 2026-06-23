# 9. Safe Change Rules

## Core Architecture Protection

### Prohibited Changes (Pre-approval Required)

| Target | Reason |
|--------|--------|
| `packages/common/kit/tool.ts` — `AnyToolDef`, `toolDef()`, `defineTool()` signatures | Core interface all package tool definitions depend on |
| `@modelcontextprotocol/sdk` version | Directly affects MCP protocol compatibility |
| `zod` version | All tool schema definitions depend on it |
| `tsup.config.mjs` `external`/`noExternal` settings | Directly affects bundling results |
| `release-please-config.json` / `.release-please-manifest.json` | Directly affects version management policy and tracked package versions |
| Tool `name` fields in `packages/*/src/tools/` | Tool identifiers exposed via MCP protocol — changes break client compatibility |

### Changes Requiring Caution (Must Verify Impact)

| Target | Notes |
|--------|-------|
| Function signature changes in `packages/common/kit/` | Used by all packages — batch update required |
| `exports` field in `packages/*/package.json` | Affects consumer import paths |
| Templates in `packages/common/build/update-readme.mjs` | Applied to all package READMEs |
| `tasks` config in turbo.json | Affects build/test pipeline order |

## Public API Path Freeze

Since each package is published to npm, public API paths exposed via the `exports` field must not be changed arbitrarily:

```json
{
  "exports": {
    ".": {                    // DO NOT CHANGE: import("@julong/mono-rele2-core")
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "bin": {
    "mono-rele2-core": "./dist/server.js",       // DO NOT CHANGE: npx @julong/mono-rele2-core
    "mono-rele2-core-cli": "./dist/cli.js"       // DO NOT CHANGE: npx @julong/mono-rele2-core-cli
  }
}
```

## Unauthorized Database Schema Changes

This project does not use a database. (No separate data storage.)

## Authentication/Authorization

This project does not include its own authentication/authorization system. MCP server authentication is delegated to client environment variable configuration (Claude Desktop, Cursor, etc.).

## Version Compatibility Rules

1. Adding tools is freely allowed in **minor versions** (`feat` commit)
2. **Renaming existing tools is prohibited** — add a new tool and have the old one output a deprecation message
3. **Removing existing tool inputSchema fields is prohibited** — fields can only be added (as optional)
4. **Changing the return type of existing tool handlers is prohibited** — must maintain `ToolResult` (`{ content: [...] }`)
5. **Breaking changes are only allowed in major version changes**

## Pre-approval Required for Large Structural Changes

The following changes require team review or approval before execution:

- Adding new packages (monorepo structure changes)
- Redesigning core interfaces in `packages/common/kit/`
- Build system changes (tsup → other bundler)
- CI/CD pipeline restructuring
- Conventional Commits policy changes
- Node.js/TypeScript major version upgrades

## Release Branch Protection

- `develop` branch: CI must pass (type check + build)
- `main` branch: Only mergeable via Auto PR from `develop` (direct push prohibited)
- Pushing to `main` triggers release-please, which opens/updates a **release PR** with version bumps + CHANGELOG; the actual tags, GitHub Releases, and npm publish happen only when that release PR is merged
- Include `[skip ci]` in commit messages to skip CI (for release commits, etc.)
