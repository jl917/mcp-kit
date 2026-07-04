import { createMcpServer, startServer } from '@common';
import { tools } from '@/tools/index';

const server = createMcpServer({ name: 'mono-rele2-core', version: '1.0.0' }, Object.values(tools));
// 서버 구동
startServer(server).catch((err) => {
  console.error('[core] server error:', err);
  process.exit(1);
});
