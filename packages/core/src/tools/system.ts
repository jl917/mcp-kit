import { defineTool, toolDef, text } from '@common';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';

export const tools = {
  echoTool: toolDef({
    name: 'echo',
    description: 'Returns the message as-is',
    inputSchema: {
      message: z.string().describe('Message to echo'),
    },
    handler: async ({ message }) => text(message),
    examples: [{ args: [`"hello world"`], result: 'hello world' }],
  }),
  timestampTool: toolDef({
    name: 'timestamp',
    description: 'Returns the current UTC timestamp',
    inputSchema: {
      format: z.enum(['iso', 'unix']).default('iso').describe('Timestamp format'),
    },
    handler: async ({ format }) => {
      const value = format === 'unix' ? String(Date.now()) : new Date().toISOString();
      return text(value);
    },
    examples: [
      { args: [], result: '2026-05-02T00:00:00.000Z' },
      { args: ['unix'], result: '1746144000000' },
    ],
  }),
  envTool: toolDef({
    name: 'env',
    description: 'Returns the value of an environment variable',
    inputSchema: {
      key: z.string().describe('Environment variable name'),
    },
    handler: async ({ key }) => text(process.env[key] ?? ''),
    examples: [
      { args: ['HOME'], result: '/Users/julong' },
      { args: ['NODE_ENV'], result: 'development' },
    ],
    guidelines: ['`envTool` returns an empty string when the variable is not set'],
  }),
  uuidTool: toolDef({
    name: 'uuid',
    description: 'Generates a random UUID v4',
    inputSchema: {},
    handler: async () => text(randomUUID()),
    examples: [{ args: [], result: '550e8400-e29b-41d4-a716-446655440000' }],
  }),
};

export const echoTool = defineTool(tools.echoTool);
export const timestampTool = defineTool(tools.timestampTool);
export const envTool = defineTool(tools.envTool);
export const uuidTool = defineTool(tools.uuidTool);
