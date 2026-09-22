import { createMcpServer, installProcessGuards, startServer, VERSION } from '@/common';
import { tools } from '@/tools';

const CONFIG = { name: 'mcp-kit', version: VERSION };

// 서버 구동
//
// 도구 등록(createMcpServer)까지 같은 비동기 흐름 안에 둔다. 톱레벨에서 부르면
// 여기서 난 예외가 잡히지 않고 프로세스가 그대로 죽고, 클라이언트에는
// `-32000 Connection closed`만 남아 원인을 알 수 없다.
async function main(): Promise<void> {
  installProcessGuards(CONFIG.name);
  const server = createMcpServer(CONFIG, Object.values(tools));
  await startServer(server, CONFIG);
}

main().catch((err) => {
  console.error('[mcp-kit] server error:', err);
  process.exit(1);
});
