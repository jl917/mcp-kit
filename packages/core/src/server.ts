import { createMcpServer, startServer } from '@common';
import { echoTool, envTool, timestampTool, uuidTool } from './tools/index.js';

const server = createMcpServer({ name: 'mono-rele2-core', version: '1.0.0' }, [
  echoTool,
  timestampTool,
  envTool,
  uuidTool,
]);

startServer(server).catch((err) => {
  console.error('[core] server error:', err);
  process.exit(1);
});
