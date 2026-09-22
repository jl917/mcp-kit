# 8. File & Component Creation Rules

## New File Locations

| What to Create | Location | Example |
|---------------|----------|---------|
| New tool | `src/tools/<name>.ts` | `src/tools/exchange.ts` |
| Tool group re-export | `src/tools/index.ts` | Add export to existing file |
| New domain module | `src/<domain>/` | `src/exchange/` |
| New scraper | `src/exchange/providers/<name>.ts` | `src/exchange/providers/daum.ts` |
| Shared kit feature | `src/common/kit/<name>.ts` | `src/common/kit/validator.ts` |
| Shared kit re-export | `src/common/kit/index.ts` | Add export to existing file |
| Shared types | `src/common/types.ts` | Add types to existing file |
| Shared constants | `src/common/constants.ts` | Add constants to existing file |
| Build/generation script | `scripts/<name>.mjs\|.ts` | `scripts/update-readme.mjs` |
| Test | `<name>.test.ts` next to the file under test | `src/exchange/parse.test.ts` |

## Checklist for Adding a New Tool

1. `src/tools/<name>.ts` — define the tool with `toolDef()` (description, inputSchema, handler, examples, guidelines)
2. `src/tools/index.ts` — merge the new tool into the `tools` object
3. `src/tools/<name>.test.ts` — unit test for the handler
4. `pnpm build && pnpm readme` — regenerate README.md
5. The exposed `name` field is part of MCP client compatibility — choose it carefully

## Decision Guide for Modifying Existing Components

| Situation | Action |
|-----------|--------|
| Add new tool | Create new file in `src/tools/` OR add to existing file (if same domain) |
| Modify existing tool logic | Only modify the tool's handler (no need to split files) |
| Change shared behavior | Modify `src/common/kit/` + verify the server, CLI, and doc generation |
| Change CLI output format | Modify `src/common/kit/cli.ts` |
| Change README format | Modify `scripts/update-readme.mjs` |
| Change SKILL.md format | Modify `generateSkillMarkdown()` in `src/common/kit/skill.ts` |

## When to Extract Shared Logic

Extract to shared logic if **any** of these conditions apply:

1. Same code used by 2+ of the MCP server / CLI / doc generation paths → Move to `src/common/kit/`
2. Same code used in 2+ tools → Extract to a utility in the owning domain directory (e.g., `src/exchange/parse.ts`)
3. Complex Zod schema reused → Extract to a shared Zod schema

## Common Naming Rules

| Item | Rule | Example |
|------|------|---------|
| Package name | `@julong/<name>` | `@julong/mcp-kit` |
| MCP server binary name | `<name>` | `mcp-kit` |
| CLI binary name | `<name>-cli` | `mcp-kit-cli` |
| Tool name (variable) | `camelCase` + `Tool` suffix | `exchangeRateTool`, `exchangeRatesTool` |
| Tool name (MCP exposed) | `snake_case` | `exchange_rate`, `exchange_rates` |
| File name | `kebab-case` | `update-readme.mjs`, `case-convert.ts` |
| Interface | `PascalCase` | `ToolDefShape`, `AnyToolDef` |
| Type (utility) | `PascalCase` | `Nullable<T>`, `Optional<T>` |
| Async function | `async function` | All tool handlers |
| Constant | `UPPER_SNAKE_CASE` | `VERSION` |
