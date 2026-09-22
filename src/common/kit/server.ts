import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { AnyToolDef } from './tool.js';

export type McpServerConfig = {
  name: string;
  version: string;
};

/**
 * 서버 로그를 남깁니다.
 *
 * stdio 전송에서 stdout은 JSON-RPC 프레임 전용입니다. 여기에 한 줄이라도
 * 섞이면 클라이언트가 스트림을 파싱하지 못하므로 로그는 전부 stderr로 갑니다.
 */
export function logServer(name: string, ...parts: unknown[]): void {
  console.error(`[${name}]`, ...parts);
}

let guardsInstalled = false;

/**
 * 프로세스를 그냥 죽게 두지 않도록 마지막 방어선을 겁니다.
 *
 * stdio MCP에서 서버 프로세스가 죽으면 클라이언트에는 원인이 남지 않고
 * `-32000 Connection closed`만 보입니다. Playwright처럼 자식 프로세스를 쥐고
 * 도는 코드는 브라우저가 갑자기 사라질 때 프라미스 체인 바깥으로 에러를
 * 흘릴 수 있고, 그 한 번으로 서버 전체가 내려갑니다.
 *
 * 그래서 새어 나온 에러를 stderr에 남기고 연결은 유지합니다. 도구 호출 하나가
 * 실패하는 것과 서버가 사라지는 것은 클라이언트 입장에서 전혀 다른 일입니다.
 */
export function installProcessGuards(name: string): void {
  if (guardsInstalled) return;
  guardsInstalled = true;

  process.on('uncaughtException', (err) => logServer(name, 'uncaughtException:', err));
  process.on('unhandledRejection', (reason) => logServer(name, 'unhandledRejection:', reason));
  // stdout이 먼저 닫히면(클라이언트 종료) 쓰기마다 EPIPE가 던져진다. 정상 종료 경로다.
  process.stdout.on('error', (err) => logServer(name, 'stdout error:', err));
}

/** Parses a comma-separated env value (e.g. WHITE_FN) into a set of tool names. */
function parseFnList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? '')
      .split(',')
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
  const registered: string[] = [];

  for (const tool of tools) {
    if (!isToolEnabled(tool.name, white, black)) continue;
    server.registerTool(
      tool.name,
      { description: tool.description, inputSchema: tool.inputSchema },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      tool.handler as any,
    );
    registered.push(tool.name);
  }

  // 도구가 하나도 안 붙으면 클라이언트에는 "도구 없는 서버"로만 보인다.
  // WHITE_FN 오타가 흔한 원인이라 서버 쪽에 흔적을 남긴다.
  if (registered.length === 0) {
    logServer(config.name, 'no tools registered — check WHITE_FN / BLACK_FN');
  }
  return server;
}

/**
 * 서버를 stdio 전송에 연결합니다.
 *
 * @param config - 로그에 남길 서버 이름·버전. 생략하면 이름 없이 남깁니다.
 */
export async function startServer(server: McpServer, config?: McpServerConfig): Promise<void> {
  const name = config?.name ?? 'mcp';
  const version = config?.version ?? 'unknown';
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // connect()가 전송 계층 콜백을 자기 것으로 덮어쓰므로, 그 뒤에 감싸서
  // 원래 동작은 그대로 두고 로그만 덧붙인다. 연결이 끊기는 순간은
  // 운영에서 `-32000`을 추적할 때 유일한 단서다.
  const onerror = transport.onerror;
  transport.onerror = (err) => {
    logServer(name, 'transport error:', err);
    onerror?.(err);
  };
  // SDK의 stdio 전송은 stdin이 끝나는 것을 보지 않는다. 클라이언트가 파이프를
  // 닫으면 서버는 아무 말 없이 사라져서, 정상 종료인지 죽은 것인지 구분되지 않는다.
  process.stdin.once('end', () => logServer(name, 'stdin closed by client — shutting down'));

  const onclose = transport.onclose;
  transport.onclose = () => {
    logServer(name, 'transport closed');
    onclose?.();
  };

  logServer(name, `ready on stdio (v${version}, node ${process.version})`);
}
