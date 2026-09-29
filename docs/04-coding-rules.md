# 4. Coding Rules

## File Naming

- **File names**: Use `kebab-case` (e.g., `readme-docs-plugin.ts`, `case-convert.ts`)
- **Interface/type files**: Use `kebab-case`
- **Test files**: Use the `*.test.ts` convention, placed next to the file under test (e.g., `src/exchange/parse.test.ts`)
- **Build scripts**: Located under `scripts/` (`readme-docs-plugin.ts`)

## TypeScript Strong Typing Rules

- **No `any`**: Avoid using `any`. The `tool.ts` handler type allows `any` for MCP SDK interface compatibility only. For new code, prefer `unknown` with type guards.
- **Zod schemas**: All tool input schemas are typed as `z.ZodRawShape`
- **Generics**: Use `toolDef<const TSchema extends z.ZodRawShape>()` pattern for type-safe schema definitions
- **`const` type parameters**: Preserve literal types when defining Zod schemas

## Tool Writing Pattern

All tools must follow this structure:

```typescript
import { defineTool, toolDef, text } from "@/common";
import { z } from "zod";

export const tools = {
  myTool: toolDef({
    name: "my_tool",                    // Name exposed to MCP (snake_case recommended)
    description: "Description",          // One-sentence tool description
    inputSchema: {
      param1: z.string().describe("Parameter description"),
      // Every field is required; `null` is the only way to say "no value".
      param2: z.number().nullable().describe("Optional parameter. null means 10"),
      param3: z.enum(["a", "b"]).describe("Choices"),
    },
    handler: async ({ param1, param2, param3 }) => {
      // Map `null` to `undefined` so the domain layer applies its default.
      return text(`result: ${param1} ${param2 ?? undefined}`);
    },
  }),
};
```

- **`toolDef()`**: Helper function with type inference (simple pass-through)
- **`defineTool()`**: Casts to `AnyToolDef` type (used when converting to arrays in server.ts)
- **`text()`**: MCP ToolResult helper producing `{ content: [{ type: "text", text: content }] }`

`AnyToolDef` also carries the optional `examples`, `guidelines`, `typeLabels`,
`typeDefs`, `returnType`, and `returnDescription` fields. Nothing reads them any
more — the documentation is hand-written — so leave them unset. The fields stay on
the type because the `toolDef()` / `defineTool()` signature is frozen
(see [09-safe-change-rules](09-safe-change-rules.md)).

## Input Schema Rules (OpenAI Tool Guide)

Tool schemas are consumed by OpenAI-compatible endpoints (the agent kit wires MCP
tools into `ChatOpenAI`), so they follow the
[OpenAI function calling guide](https://developers.openai.com/api/docs/guides/function-calling).
Strict mode rejects the whole request when an unsupported keyword survives, so the
following are banned in `inputSchema`:

| Banned | Emitted keyword | Use instead |
|--------|-----------------|-------------|
| `.default(x)` | `default` | `.nullable()`, and document the default in `.describe()` |
| `.optional()` / `.nullish()` | drops the field from `required` | `.nullable()` |
| `.positive()` / `.min()` / `.max()` | `exclusiveMinimum`, `minimum`, `maximum` | Clamp in the domain layer, and document the range in `.describe()` |
| `.int()` | `minimum` / `maximum` (zod 4 safe-integer bounds) | Plain `z.number()` |
| `.length()` / `.regex()` | `minLength`, `maxLength`, `pattern` | Validate in the handler or domain layer |

Consequences to keep in mind:

- **Every field is `required`.** The guide states "All fields in `properties` must be
  marked as `required`." Callers cannot omit a field; they pass `null`.
- **`null` means "use the default."** Handlers map `null` to `undefined` so the
  domain layer (`src/exchange/`, `src/tmdb/`, `src/system/`) applies the default.
- **Defaults and ranges live in `.describe()`**, which is the only place the model
  reads them, and are repeated in `README.md` and `SKILL.md`.
- **`src/tools/openai-schema.test.ts` enforces all of this** against the JSON Schema
  the MCP SDK actually emits. Add no tool that fails it.

## Maximum File Length

- **Tool definition files**: Maximum 200 lines recommended (split into separate files when too many tools)
- **Handler logic**: Inline within tool definition files when possible. Extract shared logic into separate utility functions.

## Documentation

`README.md` and `skills/<bin>/SKILL.md` are hand-written. There is no generator and
no `pnpm readme` command — adding or changing a tool means editing both files by hand,
including the defaults and ranges that no longer live in the schema.

## Import/Export Rules

- **Named exports** only (no default exports)
- **Path alias**:
  - `@/*` → `src/*`. Defined in the root `tsconfig.json` `paths`; `rstest.config.ts` mirrors the same alias for tests.
  - Import the shared kit as `@/common` and the agent kit as `@/common/agent` (`@/common` does not re-export `agent/`).
- **Relative vs alias**: Use `@/` for cross-directory imports (e.g., `server.ts` → `@/tools/index`). Keep relative paths for same-directory siblings (e.g., `./exchange`).
- **File extensions**: Omit them (`moduleResolution: "Bundler"` — tsc, tsup/esbuild, and rstest all resolve the `.ts` file). Everything is bundled, so no runtime extension is required.
- **Re-export**: Use `export { tools } from "./exchange"` to selectively re-export only what's needed

## Comment Guidelines

- **Tool descriptions**: Write concisely in the `description` field
- **Zod describe**: Add `.describe()` for every parameter. It is mandatory — with `default` and range keywords banned from the schema, `.describe()` is the only place the model learns them
- **Code comments**: Only use when explaining essential reasoning (always include a reason for `eslint-disable` comments)
- **Usage notes**: Write them in `README.md` and `SKILL.md`, not in the tool definition

## Async Handling

- All tool handlers must be `async` functions
- Handle errors with `try/catch` inside handlers, or use `handleCliError()` for Zod error auto-formatting in CLI
- The MCP SDK handles async errors internally for server mode

## Global Error Handling

- **CLI**: `handleCliError()` catches `ZodError` and converts to user-friendly messages
- **MCP Server**: Top-level `catch` in `server.ts` terminates the process
- Exceptions inside tool handlers are automatically converted to `CallToolResult` error responses by the MCP SDK
