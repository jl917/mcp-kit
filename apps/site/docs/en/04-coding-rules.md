# 4. Coding Rules

## File Naming

- **File names**: Use `kebab-case` (e.g., `update-readme.mjs`, `case-convert.ts`)
- **Interface/type files**: Use `kebab-case`
- **Test files**: Use `*.test.ts` convention
- **Build config files**: Located under `packages/common/build/` with `.mjs` extension

## TypeScript Strong Typing Rules

- **No `any`**: Avoid using `any`. The `tool.ts` handler type allows `any` for MCP SDK interface compatibility only. For new code, prefer `unknown` with type guards.
- **Zod schemas**: All tool input schemas are typed as `z.ZodRawShape`
- **Generics**: Use `toolDef<const TSchema extends z.ZodRawShape>()` pattern for type-safe schema definitions
- **`const` type parameters**: Preserve literal types when defining Zod schemas

## Tool Writing Pattern

All tools must follow this structure:

```typescript
import { defineTool, toolDef, text } from "@common";
import { z } from "zod";

export const tools = {
  myTool: toolDef({
    name: "my_tool",                    // Name exposed to MCP (snake_case recommended)
    description: "Description",          // One-sentence tool description
    inputSchema: {
      param1: z.string().describe("Parameter description"),
      param2: z.number().optional().describe("Optional parameter"),
      param3: z.enum(["a", "b"]).default("a").describe("Choices"),
    },
    handler: async ({ param1, param2, param3 }) => {
      // Async handler
      return text(`result: ${param1}`);
    },
    examples: [                          // Examples shown in README/Skill docs
      { args: ['"hello"'], result: "result: hello" },
    ],
    guidelines: [                        // Guidelines shown in CLI/Skill docs
      "Use this tool when ...",
    ],
    typeLabels: {                        // (Optional) Override type labels in README/API docs
      param1: "MyCustomType",
    },
    typeDefs: {                          // (Optional) TypeScript type definitions for complex types
      param1: "type MyCustomType = string | number",
    },
    returnType: "string",                // (Optional) Return type (for API docs)
    returnDescription: "Transformed result string",
  }),
};
```

- **`toolDef()`**: Helper function with type inference (simple pass-through)
- **`defineTool()`**: Casts to `AnyToolDef` type (used when converting to arrays in server.ts)
- **`text()`**: MCP ToolResult helper producing `{ content: [{ type: "text", text: content }] }`

## Maximum File Length

- **Tool definition files**: Maximum 200 lines recommended (split into separate files when too many tools)
- **Handler logic**: Inline within tool definition files when possible. Extract shared logic into separate utility functions.

## Documentation Helpers

`packages/common/kit/skill.ts` provides 3 helpers for generating README and Skill documents:

| Function | Purpose |
|----------|---------|
| `generateSkillMarkdown()` | Called in tsup's `onSuccess`, creates `dist/skills/<binName>/skill.md` |
| `generateReadmeSkills()` | Displays brief tool list in README (deprecated) |
| `generateReadmeApiDocs()` | Generates detailed TypeDoc/API-style tool documentation in README (currently used) |

`update-readme.mjs` uses `generateReadmeApiDocs()` to generate API docs in README.md with tool signatures, parameters, return types, type definitions, CLI usage, and examples.

## Import/Export Rules

- **Named exports** only (no default exports)
- **Path alias**: Use `@common` (mapped to `../common/index.ts`). Only used when referencing the `common/` module from outside a package.
- **Relative paths**: Use relative paths for modules within the same package (e.g., `./tools/system.js`)
- **File extensions**: Import with `.js` extension (TypeScript's NodeNext moduleResolution — tsc finds the actual `.ts` file)
- **Re-export**: Use `export { tools } from "./tools/system.js"` to selectively re-export only what's needed

## Comment Guidelines

- **Tool descriptions**: Write concisely in the `description` field (rendered directly in README/Skill docs)
- **Zod describe**: Add `.describe()` for each parameter (displayed in README tables)
- **Code comments**: Only use when explaining essential reasoning (always include a reason for `eslint-disable` comments)
- **Guidelines**: Add usage notes to the `guidelines` array as strings

## Async Handling

- All tool handlers must be `async` functions
- Handle errors with `try/catch` inside handlers, or use `handleCliError()` for Zod error auto-formatting in CLI
- The MCP SDK handles async errors internally for server mode

## Global Error Handling

- **CLI**: `handleCliError()` catches `ZodError` and converts to user-friendly messages
- **MCP Server**: Top-level `catch` in `server.ts` terminates the process
- Exceptions inside tool handlers are automatically converted to `CallToolResult` error responses by the MCP SDK
