# 5. UI & Design System

> This project is an **MCP Server Kit** and does not include UI/UX components or visual interfaces.
> All interactions happen via CLI (terminal) or AI-based interfaces through the MCP protocol.

## CLI Output Rules

CLI output via `runCli()` follows these formats:

- **Tool list** (when run without arguments):
  ```
  Available skills:

    echoTool
    Returns the message as-is
      message    Message to echo
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

- **Functions in `packages/common/kit/` are reused across all packages** — changes affect all packages
- **Avoid duplicating tool definitions** between `update-readme.mjs` and `src/tools/*.ts` — bun imports TS source directly, so no duplicate files
- **Build config (`tsup.config.mjs`)** is shared by all packages — check impact on other packages before modifying
- **Documentation helpers** (`generateReadmeApiDocs()` in `skill.ts`) use `typeLabels`, `typeDefs`, `returnType`, `returnDescription` fields to generate rich API docs. Include these fields when defining tools.
