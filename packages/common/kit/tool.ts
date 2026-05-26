import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

export type ToolResult = CallToolResult;

export type ToolExample = {
  args: string[];
  result: string;
};

type ToolDefShape<TSchema extends z.ZodRawShape> = {
  name: string;
  description: string;
  inputSchema: TSchema;
  handler: (input: z.infer<z.ZodObject<TSchema>>) => Promise<ToolResult>;
  examples?: ToolExample[];
  guidelines?: string[];
  typeLabels?: { [K in keyof TSchema]?: string };
  typeDefs?: { [K in keyof TSchema]?: string };
};

export type AnyToolDef = {
  name: string;
  description: string;
  inputSchema: z.ZodRawShape;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handler: (args: any) => Promise<ToolResult>;
  examples?: ToolExample[];
  guidelines?: string[];
  typeLabels?: Record<string, string>;
  typeDefs?: Record<string, string>;
};

export function toolDef<const TSchema extends z.ZodRawShape>(def: ToolDefShape<TSchema>) {
  return def;
}

export function defineTool<const TSchema extends z.ZodRawShape>(tool: ToolDefShape<TSchema>): AnyToolDef {
  return tool as AnyToolDef;
}

export function text(content: string): ToolResult {
  return { content: [{ type: "text", text: content }] };
}
