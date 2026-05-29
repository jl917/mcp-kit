import { z } from "zod";
import type { ToolResult } from "./tool.js";

/// A simple CLI framework for defining and running tools with structured input and output.
type CliTools = Record<
  string,
  {
    name: string;
    description: string;
    inputSchema: z.ZodRawShape;
    handler: (args: any) => Promise<ToolResult>;
  }
>;

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
