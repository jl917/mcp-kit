import { z } from "zod";
import type { AnyToolDef } from "./tool.js";

// Escapes `|` so the text stays inside a single markdown table cell.
// Only apply at table-cell insertion points — never inside code blocks/signatures.
const escapePipe = (s: string): string => s.replace(/\|/g, "\\|");

// 테스트
export type SkillTools = Record<string, AnyToolDef>;

export function generateSkillMarkdown(opts: { binName: string; description: string; tools: SkillTools }): string {
  const { binName, description, tools } = opts;
  return `---
name: ${binName}
description: ${description}
---

# ${binName}

\`\`\`sh
${binName} <toolName> [...args]
\`\`\`

## Skills

${renderSkills(tools)}

## Examples

${renderExamples(binName, tools)}

## Guidelines

${renderGuidelines(binName, tools)}
`;
}

function renderSkills(tools: SkillTools): string {
  return Object.entries(tools)
    .map(([key, tool]) => {
      const rows = Object.entries(tool.inputSchema)
        .map(([field, schema]) => {
          const label = tool.typeLabels?.[field];
          return `| \`${field}\` | ${describeField(schema as z.ZodTypeAny, label)} |`;
        })
        .join("\n");
      const defs = tool.typeDefs
        ? Object.entries(tool.typeDefs)
            .map(([field, def]) => `\n\n**\`${field}\`** type definition:\n\`\`\`typescript\n${def}\n\`\`\``)
            .join("")
        : "";
      return `### ${key}\n\n${tool.description}\n\n| arg | description |\n|-----|-------------|\n${rows}${defs}`;
    })
    .join("\n\n");
}

function describeField(schema: z.ZodTypeAny, typeLabel?: string): string {
  const baseDesc = schema.description ?? "";
  let inner: z.ZodTypeAny = schema;
  let defaultValue: unknown;
  let isOptional = false;

  while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
    if (inner instanceof z.ZodDefault) {
      const raw = (inner.def as { defaultValue: unknown }).defaultValue;
      defaultValue = typeof raw === "function" ? (raw as () => unknown)() : raw;
    }
    if (inner instanceof z.ZodOptional) isOptional = true;
    inner = (inner as z.ZodOptional<z.ZodTypeAny> | z.ZodDefault<z.ZodTypeAny>).unwrap() as z.ZodTypeAny;
  }

  const parts: string[] = [];
  if (typeLabel) parts.push(`Type: ${typeLabel}`);
  if (baseDesc) parts.push(baseDesc);
  if (inner instanceof z.ZodEnum) {
    const values = (inner.options as string[]).map((v) => `\`${v}\``).join(" | ");
    parts.push(values);
  }
  if (defaultValue !== undefined) parts.push(`default: \`${String(defaultValue)}\``);
  else if (isOptional) parts.push("optional");
  return escapePipe(parts.join(" — "));
}

function renderExamples(binName: string, tools: SkillTools): string {
  const lines: string[] = [];
  for (const [key, tool] of Object.entries(tools)) {
    if (!tool.examples) continue;
    for (const ex of tool.examples) {
      const cmd = [binName, key, ...ex.args].join(" ");
      lines.push(`- \`${cmd}\` => \`${ex.result}\``);
    }
  }
  return lines.join("\n");
}

function renderGuidelines(binName: string, tools: SkillTools): string {
  const items: string[] = [];
  const seen = new Set<string>();
  const push = (g: string) => {
    if (seen.has(g)) return;
    seen.add(g);
    items.push(g);
  };

  push("Arguments are positional — pass them in the order listed in each skill's table");

  const allSchemas = Object.values(tools).flatMap((t) => Object.values(t.inputSchema)) as z.ZodTypeAny[];
  if (allSchemas.some((s) => containsType(s, z.ZodNumber))) {
    push("Numeric args are auto-parsed — pass as plain numbers (e.g. `10`)");
  }
  if (allSchemas.some((s) => containsType(s, z.ZodArray))) {
    push('Array args must be valid JSON — wrap in single quotes on Unix shells (e.g. `\'["a","b"]\'`)');
  }
  if (allSchemas.some((s) => s instanceof z.ZodOptional || s instanceof z.ZodDefault)) {
    push("Optional args with defaults may be omitted");
  }

  for (const tool of Object.values(tools)) {
    if (!tool.guidelines) continue;
    for (const g of tool.guidelines) push(g);
  }

  push(`Run \`${binName}\` with no args to list all available skills`);

  return items.map((g) => `- ${g}`).join("\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function containsType(schema: z.ZodTypeAny, ctor: new (...a: any[]) => z.ZodTypeAny): boolean {
  let inner: z.ZodTypeAny = schema;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
    inner = (inner as z.ZodOptional<z.ZodTypeAny> | z.ZodDefault<z.ZodTypeAny>).unwrap() as z.ZodTypeAny;
  }
  return inner instanceof ctor;
}

export function generateReadmeSkills(opts: { binName: string; tools: SkillTools }): string {
  const { binName, tools } = opts;
  return Object.entries(tools)
    .map(([key, tool]) => renderReadmeSkill(binName, key, tool))
    .join("\n\n");
}

function renderReadmeSkill(binName: string, key: string, tool: AnyToolDef): string {
  const fields = Object.entries(tool.inputSchema);

  const usageArgs = fields
    .map(([field, schema]) => {
      const isOpt = schema instanceof z.ZodOptional || schema instanceof z.ZodDefault;
      return isOpt ? `[${field}]` : `<${field}>`;
    })
    .join(" ");
  const usage = [binName, key, usageArgs].filter(Boolean).join(" ");

  const rows = fields
    .map(([field, schema]) => {
      const label = tool.typeLabels?.[field];
      const t = describeReadmeType(schema as z.ZodTypeAny, label);
      const d = describeReadmeDesc(schema as z.ZodTypeAny);
      return `| \`${field}\` | ${escapePipe(t)} | ${escapePipe(d)} |`;
    })
    .join("\n");

  const examples = tool.examples ?? [];
  let exampleBlock = "";
  if (examples.length > 0) {
    const cmds = examples.map((ex) => [binName, key, ...ex.args].join(" "));
    const width = Math.max(...cmds.map((c) => c.length));
    const lines = examples.map((ex, i) => `${cmds[i].padEnd(width)}    # ${ex.result}`);
    exampleBlock = `\n\n\`\`\`sh\n${lines.join("\n")}\n\`\`\``;
  }

  const defs = tool.typeDefs
    ? Object.entries(tool.typeDefs)
        .map(
          ([field, def]) =>
            `\n\n**\`${field}\`** type definition:\n\n\`\`\`typescript\n${def}\n\`\`\``,
        )
        .join("")
    : "";

  const tableBlock = rows ? `\n\n| arg | type | description |\n|-----|------|-------------|\n${rows}` : "";

  return `#### \`${key}\`

${tool.description}.

\`\`\`sh
${usage}
\`\`\`${tableBlock}${defs}${exampleBlock}`;
}

function describeReadmeType(schema: z.ZodTypeAny, typeLabel?: string): string {
  if (typeLabel) return typeLabel;

  let inner: z.ZodTypeAny = schema;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
    inner = (inner as z.ZodOptional<z.ZodTypeAny> | z.ZodDefault<z.ZodTypeAny>).unwrap() as z.ZodTypeAny;
  }
  if (inner instanceof z.ZodEnum) {
    return (inner.options as string[]).map((v) => `\`${v}\``).join(" | ");
  }
  if (inner instanceof z.ZodNumber) return "number";
  if (inner instanceof z.ZodString) return "string";
  if (inner instanceof z.ZodBoolean) return "boolean";
  if (inner instanceof z.ZodArray) return "JSON string (array)";
  if (inner instanceof z.ZodUnion) {
    const types = inner.options.map((o) => describeReadmeType(o as unknown as z.ZodTypeAny));
    return types.join(" | ");
  }
  if (inner instanceof z.ZodRecord) return "JSON object";
  return "unknown";
}

// ---------------------------------------------------------------------------
// Lodash-style API docs renderer
// ---------------------------------------------------------------------------

/**
 * Generates detailed API documentation for each tool in lodash/TypeDoc style.
 * Each tool section includes: signature, description, parameters, return type,
 * type definitions, CLI usage, and examples.
 */
export function generateReadmeApiDocs(opts: { binName: string; tools: SkillTools }): string {
  const { binName, tools } = opts;
  return Object.entries(tools)
    .map(([key, tool]) => renderToolApiDoc(binName, key, tool))
    .join("\n\n");
}

function renderToolApiDoc(binName: string, key: string, tool: AnyToolDef): string {
  const fields = Object.entries(tool.inputSchema);
  const toolName = tool.name;

  // Build parameter list for signature: (a, b, c?)
  const sigParams = fields
    .map(([field, schema]) => {
      const label = tool.typeLabels?.[field] ?? describeReadmeType(schema as z.ZodTypeAny);
      const isOpt = schema instanceof z.ZodOptional || schema instanceof z.ZodDefault;
      return `${field}${isOpt ? "?" : ""}: ${label}`;
    })
    .join(", ");

  const returnType = tool.returnType ?? "string";
  const signature = `function ${toolName}(${sigParams}): ${returnType}`;

  // Parameter table
  const paramRows = fields
    .map(([field, schema]) => {
      const label = tool.typeLabels?.[field] ?? describeReadmeType(schema as z.ZodTypeAny);
      const desc = describeReadmeDesc(schema as z.ZodTypeAny);
      return `| \`${field}\` | \`${escapePipe(label)}\` | ${escapePipe(desc)} |`;
    })
    .join("\n");
  const paramBlock = paramRows
    ? `\n\n**Parameters**\n\n| Name | Type | Description |\n|------|------|-------------|\n${paramRows}`
    : "";

  // Return block
  const returnDesc = tool.returnDescription ?? "";
  const returnBlock = returnDesc
    ? `\n\n**Returns**\n\n\`${returnType}\` — ${returnDesc}`
    : `\n\n**Returns**\n\n\`${returnType}\``;

  // CLI usage
  const usageArgs = fields
    .map(([field, schema]) => {
      const isOpt = schema instanceof z.ZodOptional || schema instanceof z.ZodDefault;
      return isOpt ? `[${field}]` : `<${field}>`;
    })
    .join(" ");
  const usage = [binName, key, usageArgs].filter(Boolean).join(" ");
  const cliBlock = `\n\n**CLI**\n\n\`\`\`sh\n${usage}\n\`\`\``;

  // Type definitions
  const defsBlock = tool.typeDefs
    ? "\n\n" +
      Object.entries(tool.typeDefs)
        .map(([field, def]) => `**\`${field}\`** type definition\n\n\`\`\`typescript\n${def}\n\`\`\``)
        .join("\n\n")
    : "";

  // Examples
  const examples = tool.examples ?? [];
  const exBlock =
    examples.length > 0
      ? "\n\n**Examples**\n\n" +
        examples
          .map((ex) => {
            const cmd = [binName, key, ...ex.args].join(" ");
            return `\`\`\`sh\n${cmd}\n# → ${ex.result}\n\`\`\``;
          })
          .join("\n")
      : "";

  return [
    `### \`${toolName}(${fields.map(([f]) => f).join(", ")})\``,
    "",
    "**Signature**",
    "",
    "```typescript",
    signature,
    "```",
    "",
    tool.description + ".",
    paramBlock,
    returnBlock,
    cliBlock,
    defsBlock,
    exBlock,
  ].join("\n");
}

function describeReadmeDesc(schema: z.ZodTypeAny): string {
  const baseDesc = schema.description ?? "";
  let inner: z.ZodTypeAny = schema;
  let defaultValue: unknown;
  let isOptional = false;
  while (inner instanceof z.ZodOptional || inner instanceof z.ZodDefault) {
    if (inner instanceof z.ZodDefault) {
      const raw = (inner.def as { defaultValue: unknown }).defaultValue;
      defaultValue = typeof raw === "function" ? (raw as () => unknown)() : raw;
    }
    if (inner instanceof z.ZodOptional) isOptional = true;
    inner = (inner as z.ZodOptional<z.ZodTypeAny> | z.ZodDefault<z.ZodTypeAny>).unwrap() as z.ZodTypeAny;
  }
  if (defaultValue !== undefined) return `${baseDesc} (default: \`${String(defaultValue)}\`)`;
  if (isOptional) return `${baseDesc} (optional)`;
  return baseDesc;
}
