import { createMcpServer, startServer } from '@/common';
import { tools } from '@/tools';
// 서버 구동
const server = createMcpServer({ name: 'mcp-kit', version: '1.0.0' }, Object.values(tools));

startServer(server).catch((err) => {
  console.error('[mcp-kit] server error:', err);
  process.exit(1);
});
