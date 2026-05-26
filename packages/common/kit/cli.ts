import { z } from "zod";
import type { ToolResult } from "./tool.js";

type CliTools = Record<
  string,
  {
    name: string;
    description: string;
    inputSchema: z.ZodRawShape;
    handler: (args: any) => Promise<ToolResult>;
  }
>;

function formatSkills(tools: CliTools): string {
  const sections = Object.entries(tools).map(([key, tool]) => {
    const params = Object.entries(tool.inputSchema);
    const maxLen = Math.max(...params.map(([f]) => f.length));
    const paramLines = params
      .map(([field, schema]) => {
        const desc = (schema as any).description ?? "";
        return `    ${field.padEnd(maxLen + 2)}${desc}`;
      })
      .join("\n");
    return `  ${key}\n  ${tool.description}\n${paramLines}`;
  });
  return "Available skills:\n\n" + sections.join("\n\n");
}

export async function runCli(tools: CliTools): Promise<void> {
  const [, , toolName, ...rawArgs] = process.argv;

  if (!toolName || !(toolName in tools)) {
    if (toolName) console.error(`Unknown skill: "${toolName}"\n`);
    process.exit(toolName ? 1 : 0);
  }

  const tool = tools[toolName];
  const fieldNames = Object.keys(tool.inputSchema);
  const rawInput: Record<string, unknown> = {};

  for (let i = 0; i < fieldNames.length; i++) {
    const raw = rawArgs[i];
    if (raw === undefined) continue;
    try {
      rawInput[fieldNames[i]] = JSON.parse(raw);
    } catch {
      rawInput[fieldNames[i]] = raw;
    }
  }

  const parsed = z.object(tool.inputSchema).parse(rawInput);
  const result = await tool.handler(parsed);

  for (const part of result.content) {
    if (part.type === "text") console.log(part.text);
  }
}

export function handleCliError(err: unknown): never {
  if (err instanceof z.ZodError) {
    console.error("Validation error:", err.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join(", "));
  } else {
    console.error("Error:", err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
}
