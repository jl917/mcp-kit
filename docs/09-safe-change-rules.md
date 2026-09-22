# 9. Safe Change Rules

## Core Architecture Protection

### Prohibited Changes (Pre-approval Required)

| Target | Reason |
|--------|--------|
| `src/common/kit/tool.ts` — `AnyToolDef`, `toolDef()`, `defineTool()` signatures | Core interface every tool definition depends on |
| `@modelcontextprotocol/sdk` version | Directly affects MCP protocol compatibility |
| `zod` version | All tool schema definitions depend on it |
| `tsup.config.ts` `external`/`noExternal` settings | Directly affects bundling results (`playwright` must stay external) |
| `release-please-config.json` / `.release-please-manifest.json` | Directly affects version management policy and the tracked version |
| Tool `name` fields in `src/tools/` | Tool identifiers exposed via MCP protocol — changes break client compatibility |

### Changes Requiring Caution (Must Verify Impact)

| Target | Notes |
|--------|-------|
| Function signature changes in `src/common/kit/` | Used by the MCP server, the CLI, and doc generation — batch update required |
| `exports` / `bin` fields in `package.json` | Affects consumer import paths and the `npx` command names |
| Templates in `scripts/update-readme.mjs` | Applied to the whole README format |
| `paths` in `tsconfig.json` | Affects every `@/*` import (update `rstest.config.ts` alongside it) |

## Public API Path Freeze

Since this repository is published to npm, public API paths exposed via the `exports` field must not be changed arbitrarily:

```json
{
  "exports": {
    ".": {                    // DO NOT CHANGE: import("@julong/mcp-kit")
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "bin": {
    "mcp-kit": "./dist/server.js",       // DO NOT CHANGE: npx @julong/mcp-kit
    "mcp-kit-cli": "./dist/cli.js"       // DO NOT CHANGE: npx mcp-kit-cli
  }
}
```

> Renaming a `bin` entry also changes the `skills/<bin>/SKILL.md` path and the CLI usage in the generated README.

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

- Repository structure changes (reshaping the `src/` layout, splitting into packages, etc.)
- Redesigning core interfaces in `src/common/kit/`
- Build system changes (tsup → other bundler)
- CI/CD pipeline restructuring
- Conventional Commits policy changes
- Node.js/TypeScript major version upgrades

## Release Branch Protection

- `main` is the only long-lived branch. Work happens on a short-lived branch and lands on `main` through a pull request — no direct push.
- CI (lint + format + type check + test + build) runs on every pull request targeting `main` and must pass before merge.
- Merging into `main` triggers release-please, which opens/updates a **release PR** with version bumps + CHANGELOG; the actual tags, GitHub Releases, and npm publish happen only when that release PR is merged
- Include `[skip ci]` in commit messages to skip the push-triggered CI run (for release commits, etc.)
