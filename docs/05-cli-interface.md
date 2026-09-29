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

- **Functions in `src/common/kit/` are reused by both the server and the CLI** — a change there affects both
- **Every field is required, and `null` means "use the default".** `runCli()` fills an omitted positional argument with `null`, so the command line behaves as if the field were optional. See [04-coding-rules](04-coding-rules.md) for why
- **Build config (`tsup.config.ts`)** drives the bundle and the shebangs. It no longer writes any documentation
- **Document arguments by hand.** `README.md` and `SKILL.md` carry the argument tables, defaults, ranges and return shapes. Nothing generates them from the tool definition.
