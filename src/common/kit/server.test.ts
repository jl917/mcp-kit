import { afterEach, describe, expect, it } from '@rstest/core';
import { z } from 'zod';
import { createMcpServer, installProcessGuards, startServer } from '@/common/kit/server';
import { defineTool, text, type AnyToolDef } from '@/common/kit/tool';

const alpha = defineTool({
  name: 'alpha',
  description: 'first tool',
  inputSchema: { q: z.string() },
  handler: async () => text('alpha'),
});

const beta = defineTool({
  name: 'beta',
  description: 'second tool',
  inputSchema: { q: z.string() },
  handler: async () => text('beta'),
});

const CONFIG = { name: 'test-kit', version: '0.0.0' };
const ALL: AnyToolDef[] = [alpha, beta];

/** 등록된 도구 이름을 MCP 서버 내부 레지스트리에서 읽어옵니다. */
function registeredNames(tools: AnyToolDef[]): string[] {
  const server = createMcpServer(CONFIG, tools) as unknown as {
    _registeredTools: Record<string, unknown>;
  };
  return Object.keys(server._registeredTools).sort();
}

afterEach(() => {
  delete process.env.WHITE_FN;
  delete process.env.BLACK_FN;
});

describe('createMcpServer()', () => {
  it('should register every tool when no filter is set', () => {
    expect(registeredNames(ALL)).toEqual(['alpha', 'beta']);
  });

  it('should keep only the allowlisted tools when WHITE_FN is set', () => {
    process.env.WHITE_FN = 'beta';
    expect(registeredNames(ALL)).toEqual(['beta']);
  });

  it('should drop the blocklisted tools when BLACK_FN is set', () => {
    process.env.BLACK_FN = 'beta';
    expect(registeredNames(ALL)).toEqual(['alpha']);
  });

  it('should let WHITE_FN win over BLACK_FN for the same tool', () => {
    process.env.WHITE_FN = 'alpha';
    process.env.BLACK_FN = 'alpha';
    expect(registeredNames(ALL)).toEqual(['alpha']);
  });

  it('should build a server even when the filter leaves no tool', () => {
    process.env.WHITE_FN = 'typo';
    expect(registeredNames(ALL)).toEqual([]);
  });
});

describe('installProcessGuards()', () => {
  it('should keep the process alive on an escaped async error', () => {
    const before = process.listeners('uncaughtException');

    installProcessGuards(CONFIG.name);
    // 한 번 더 불러도 핸들러가 중복으로 붙지 않아야 한다.
    installProcessGuards(CONFIG.name);

    const added = process.listeners('uncaughtException').filter((fn) => !before.includes(fn));
    expect(added).toHaveLength(1);

    try {
      // 프로세스를 죽이는 대신 stderr로 흘려보낸다 — 여기서 서버가 내려가면
      // 클라이언트에는 `-32000 Connection closed`만 남는다.
      expect(() =>
        added[0](new Error('playwright: browser has been closed'), 'uncaughtException'),
      ).not.toThrow();
    } finally {
      // 테스트 프로세스의 기본 예외 처리를 되돌린다.
      for (const fn of added) process.off('uncaughtException', fn);
    }
  });
});

describe('startServer()', () => {
  it('should log to stderr only, keeping stdout free for JSON-RPC frames', async () => {
    const server = createMcpServer(CONFIG, ALL);
    const stdout: string[] = [];
    const logged: string[] = [];

    const writeOut = process.stdout.write.bind(process.stdout);
    const errorLog = console.error;
    process.stdout.write = ((chunk: string) => {
      stdout.push(String(chunk));
      return true;
    }) as typeof process.stdout.write;
    console.error = (...parts: unknown[]) => logged.push(parts.map(String).join(' '));

    try {
      await startServer(server, CONFIG);
    } finally {
      process.stdout.write = writeOut;
      console.error = errorLog;
      await server.close();
    }

    expect(stdout).toEqual([]);
    expect(logged.join('\n')).toContain(`[${CONFIG.name}] ready on stdio`);
  });
});
