# 5. CLI & Interface Conventions

> This project is an **MCP Server Kit** and does not include UI/UX components or visual interfaces.
> All interactions happen via CLI (terminal) or AI-based interfaces through the MCP protocol.

## CLI Output Rules

CLI output via `runCli()` follows these formats:

- **Tool list** (when run without arguments):
  ```
  Available skills:

    exchangeRateTool
    Fetches the KRW rate for one currency from one portal
      provider    Portal to query
      currency    Currency to query
  ```
  - Tool names indented by 2 spaces
  - Description on the next line after the tool name
  - Parameters indented by 4 spaces: parameter name + description

- **Tool execution result**: Plain text via `console.log()`
- **Error messages**: Output to stderr via `console.error()`

## CLI UX Rules

- Tool execution results must be **plain text only** (no colors, formatting, or emojis)
- Error messages should be human-readable natural language (no stack traces)
- `handleCliError()` parses `ZodError` and outputs in `"fieldName: error message"` format
- In MCP server mode, all output is passed as `text` items in the `CallToolResult.content` array

## Accessibility

- CLI does not depend on visual elements (pure text-based)
- MCP protocol delegates result formatting to AI assistants, so no separate accessibility handling is needed

## Component Reuse Notes

- **Functions in `src/common/kit/` are reused by the server, the CLI, and the doc generators** — a change there affects all three
- **Avoid duplicating tool definitions** between `scripts/update-readme.mjs` and `src/tools/*.ts` — bun imports TS source directly, so no duplicate files
- **Build config (`tsup.config.ts`)** drives the bundle, the shebangs, and skill/README generation — check all three before modifying
- **Documentation helpers** (`generateReadmeApiDocs()` in `skill.ts`) use `typeLabels`, `typeDefs`, `returnType`, `returnDescription` fields to generate rich API docs. Include these fields when defining tools.
