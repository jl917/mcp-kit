import { afterEach, describe, expect, it } from '@rstest/core';
import { existsSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { appendLog, FileLogCallback, formatLogBlock, logFileFor, LOG_DIR, REDACTED } from './log';

const TASK_ID = 'rstest-log-fixture';

afterEach(() => {
  rmSync(logFileFor(TASK_ID), { force: true });
});

describe('logFileFor()', () => {
  it('should place the log under the .log directory', () => {
    expect(logFileFor('exchange-001')).toBe(join(LOG_DIR, 'exchange-001.log'));
  });

  it('should not let a taskId escape the .log directory', () => {
    expect(logFileFor('../../etc/passwd')).toBe(join(LOG_DIR, '_etc_passwd.log'));
    expect(logFileFor('a/b c:d')).toBe(join(LOG_DIR, 'a_b_c_d.log'));
  });

  it('should fall back to a default name for an empty taskId', () => {
    expect(logFileFor('')).toBe(join(LOG_DIR, 'task.log'));
  });
});

describe('formatLogBlock()', () => {
  it('should write a timestamped header followed by JSON', () => {
    const block = formatLogBlock('TOOL END', { ok: true }, 120);
    const [header, ...body] = block.trimEnd().split('\n');
    expect(header).toMatch(/^\[\d{4}-\d{2}-\d{2}T[\d:.]+Z\] \[TOOL END\] \(\+120ms\)$/);
    expect(JSON.parse(body.join('\n'))).toEqual({ ok: true });
  });

  it('should omit the elapsed suffix when no duration is given', () => {
    expect(formatLogBlock('RUN START', {})).toContain('] [RUN START]\n');
  });

  it('should survive circular references', () => {
    const node: Record<string, unknown> = { name: 'root' };
    node.self = node;
    expect(formatLogBlock('CHAIN START', node)).toContain('"self": "[Circular]"');
  });

  it('should truncate very long strings', () => {
    const block = formatLogBlock('LLM END', { text: 'x'.repeat(9000) });
    expect(block).toContain('(9000 chars)');
    expect(block.length).toBeLessThan(6000);
  });

  it('should redact values stored under credential-looking keys', () => {
    const block = formatLogBlock('LLM START', {
      configuration: {
        apiKey: 'sk-abcdefghijklmnopqrstuvwxyz012345',
        baseURL: 'https://api.test/v1',
      },
      headers: { Authorization: 'Bearer abc' },
      usage: { total_tokens: 42 },
    });
    expect(block).not.toContain('sk-abcdefghijklmnopqrstuvwxyz012345');
    expect(block).not.toContain('Bearer abc');
    expect(block).toContain(REDACTED);
    // 자격 증명이 아닌 필드는 그대로 남아야 한다
    expect(block).toContain('https://api.test/v1');
    expect(block).toContain('"total_tokens": 42');
  });

  it('should redact key-shaped tokens even when the field name looks innocent', () => {
    const block = formatLogBlock('TEXT', {
      note: 'use sk-abcdefghijklmnopqrstuvwxyz012345 to auth',
    });
    expect(block).not.toContain('sk-abcdefghijklmnopqrstuvwxyz012345');
    expect(block).toContain(REDACTED);
  });

  it('should serialize errors with name, message and stack', () => {
    const parsed = JSON.parse(
      formatLogBlock('RUN ERROR', new Error('boom')).split('\n').slice(1).join('\n'),
    );
    expect(parsed).toMatchObject({ name: 'Error', message: 'boom' });
    expect(typeof parsed.stack).toBe('string');
  });
});

describe('appendLog()', () => {
  it('should append each event to the task log file', () => {
    appendLog(TASK_ID, 'RUN START', { step: 1 });
    appendLog(TASK_ID, 'RUN END', { step: 2 }, 42);

    const contents = readFileSync(logFileFor(TASK_ID), 'utf-8');
    expect(contents).toContain('[RUN START]');
    expect(contents).toContain('[RUN END] (+42ms)');
    expect(contents.indexOf('[RUN START]')).toBeLessThan(contents.indexOf('[RUN END]'));
  });
});

describe('FileLogCallback', () => {
  it('should record callback events into the task log file', () => {
    const logger = new FileLogCallback(TASK_ID);
    expect(logger.logFile).toBe(logFileFor(TASK_ID));

    logger.handleToolStart(
      {} as never,
      'input',
      'run-1',
      undefined,
      undefined,
      undefined,
      'exchange_rates',
    );
    expect(existsSync(logger.logFile)).toBe(true);
    expect(readFileSync(logger.logFile, 'utf-8')).toContain('[TOOL START]');
    expect(logger.elapsedMs).toBeGreaterThanOrEqual(0);
  });

  it('should pair a tool start with its end and expose it via toolCalls', () => {
    const logger = new FileLogCallback(TASK_ID);
    const args = '{"provider":"daum","currency":"JPY"}';

    logger.handleToolStart(
      {} as never,
      args,
      'run-1',
      undefined,
      undefined,
      undefined,
      'exchange_rate',
    );
    expect(logger.toolCalls).toHaveLength(0); // 아직 끝나지 않았다

    logger.handleToolEnd({ content: '{"rate":8.72}' } as never, 'run-1');

    expect(logger.toolCalls).toHaveLength(1);
    expect(logger.toolCalls[0]).toMatchObject({
      name: 'exchange_rate',
      input: args,
      output: '{"rate":8.72}',
      error: null,
    });
    expect(logger.toolCalls[0].durationMs).toBeGreaterThanOrEqual(0);
  });

  it('should keep the calls in invocation order', () => {
    const logger = new FileLogCallback(TASK_ID);
    logger.handleToolStart({} as never, 'a', 'run-1', undefined, undefined, undefined, 'first');
    logger.handleToolStart({} as never, 'b', 'run-2', undefined, undefined, undefined, 'second');
    // 끝나는 순서가 뒤바뀌어도 runId로 짝지으므로 이름이 섞이지 않는다
    logger.handleToolEnd('out-b' as never, 'run-2');
    logger.handleToolEnd('out-a' as never, 'run-1');

    expect(logger.toolCalls.map((call) => [call.name, call.input, call.output])).toEqual([
      ['second', 'b', 'out-b'],
      ['first', 'a', 'out-a'],
    ]);
  });

  it('should record a failed tool call with its error', () => {
    const logger = new FileLogCallback(TASK_ID);
    logger.handleToolStart(
      {} as never,
      '{}',
      'run-1',
      undefined,
      undefined,
      undefined,
      'exchange_rates',
    );
    logger.handleToolError(new Error('browser launch failed'), 'run-1');

    expect(logger.toolCalls).toHaveLength(1);
    expect(logger.toolCalls[0]).toMatchObject({
      name: 'exchange_rates',
      output: null,
      error: 'browser launch failed',
    });
  });

  it('should ignore an end event with no matching start', () => {
    const logger = new FileLogCallback(TASK_ID);
    logger.handleToolEnd('orphan' as never, 'unknown-run');
    expect(logger.toolCalls).toHaveLength(0);
  });
});
