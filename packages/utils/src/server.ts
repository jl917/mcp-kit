import { createMcpServer, startServer } from '@common';
import { tools } from '@/tools';

const server = createMcpServer(
  { name: 'mono-rele2-utils', version: '1.0.0' },
  Object.values(tools),
);

startServer(server).catch((err) => {
  console.error('[utils] server error:', err);
  process.exit(1);
});
