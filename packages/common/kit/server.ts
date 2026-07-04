import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { AnyToolDef } from "./tool.js";

export type McpServerConfig = {
  name: string;
  version: string;
};

/** Parses a comma-separated env value (e.g. WHITE_FN) into a set of tool names. */
function parseFnList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((name) => name.trim())
      .filter(Boolean),
  );
}

/**
 * Decides whether a tool is enabled based on the WHITE_FN / BLACK_FN env lists (matched by `tool.name`).
 * - Listed in WHITE_FN → always enabled (takes priority over BLACK_FN).
 * - Listed in BLACK_FN → disabled.
 * - Listed in neither → enabled only when WHITE_FN is empty (a non-empty WHITE_FN acts as an allowlist).
 */
function isToolEnabled(name: string, white: Set<string>, black: Set<string>): boolean {
  if (white.has(name)) return true;
  if (black.has(name)) return false;
  return white.size === 0;
}

export function createMcpServer(config: McpServerConfig, tools: AnyToolDef[]): McpServer {
  const white = parseFnList(process.env.WHITE_FN);
  const black = parseFnList(process.env.BLACK_FN);
  const server = new McpServer(config);
  for (const tool of tools) {
    if (!isToolEnabled(tool.name, white, black)) continue;
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tool.handler as any,
    );
  }
  return server;
}

export async function startServer(server: McpServer): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
