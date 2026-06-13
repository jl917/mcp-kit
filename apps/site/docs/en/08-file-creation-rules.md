# 8. File & Component Creation Rules

## New File Locations

| What to Create | Location | Example |
|---------------|----------|---------|
| New MCP server package | `packages/<name>/` | `packages/date/` |
| New tool in existing package | `packages/<name>/src/tools/<name>.ts` | `packages/core/src/tools/network.ts` |
| Tool group re-export | `packages/<name>/src/tools/index.ts` | Add export to existing file |
| Shared kit feature | `packages/common/kit/<name>.ts` | `packages/common/kit/validator.ts` |
| Shared kit re-export | `packages/common/kit/index.ts` | Add export to existing file |
| Shared types | `packages/common/types.ts` | Add types to existing file |
| Shared constants | `packages/common/constants.ts` | Add constants to existing file |

## Required Files for New Packages

When adding a new package, **all** of the following files are required:

1. `package.json` — includes name, version, description, exports, bin, scripts, dependencies
2. `tsconfig.json` — includes `@common` path alias, `NodeNext` module, `noEmit: true`
3. `tsup.config.ts` — calls `createTsupConfig()`
4. `src/index.ts` — `export { tools } from "./tools/index.js"` + `export { generateSkillMarkdown, generateReadmeSkills } from "@common"`
5. `src/server.ts` — MCP server creation and startup
6. `src/cli.ts` — CLI execution
7. `src/tools/index.ts` — tools re-export
8. `src/tools/<name>.ts` — actual tool definitions

### `./common-update.md` (Release Pipeline Related)

`packages/core/common-update.md` and `packages/utils/common-update.md` are auto-managed by the release workflow. Do not edit manually. They are only updated when `packages/common/` changes.

## Decision Guide for Modifying Existing Components

| Situation | Action |
|-----------|--------|
| Add new tool | Create new file in `src/tools/` OR add to existing file (if same domain) |
| Modify existing tool logic | Only modify the tool's handler (no need to split files) |
| Change shared behavior | Modify `packages/common/kit/` + rebuild all packages |
| Change CLI output format | Modify `formatSkills()` in `packages/common/kit/cli.ts` |
| Change README format | Modify `packages/common/build/update-readme.mjs` |

## When to Extract Shared Logic

Extract to shared logic if **any** of these conditions apply:

1. Same code used in 2+ packages → Move to `packages/common/kit/`
2. Same code used in 2+ tools within 1 package → Extract to a utility function within the package (e.g., `cn.ts`)
3. Complex Zod schema reused → Extract to a shared Zod schema

## Common Naming Rules

| Item | Rule | Example |
|------|------|---------|
| Package name | `@julong/<description>` | `@julong/mono-rele2-core` |
| CLI binary name | `<package-name>-cli` | `mono-rele2-core-cli` |
| Tool name (variable) | `camelCase` + `Tool` suffix | `echoTool`, `timestampTool` |
| Tool name (MCP exposed) | `snake_case` | `echo`, `case_convert` |
| File name | `kebab-case` | `update-readme.mjs`, `case-convert.ts` |
| Interface | `PascalCase` | `ToolDefShape`, `AnyToolDef` |
| Type (utility) | `PascalCase` | `Nullable<T>`, `Optional<T>` |
| Async function | `async function` | All tool handlers |
| Constant | `UPPER_SNAKE_CASE` | `VERSION` |
