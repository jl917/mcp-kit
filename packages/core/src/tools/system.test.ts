import { describe, expect, it } from '@rstest/core';
import { echoTool, timestampTool, envTool, uuidTool } from './system.js';
// core만 배포
describe('echoTool', () => {
  it('should return the message as-is', async () => {
    const result = await echoTool.handler({ message: 'hello world' });
    expect(result.content[0]).toEqual({ type: 'text', text: 'hello world' });
  });

  it('should handle empty string', async () => {
    const result = await echoTool.handler({ message: '' });
    expect(result.content[0]).toEqual({ type: 'text', text: '' });
  });

  it('should handle special characters', async () => {
    const result = await echoTool.handler({ message: 'a\nb\tc' });
    expect(result.content[0]).toEqual({ type: 'text', text: 'a\nb\tc' });
  });
});

describe('timestampTool', () => {
  it('should return ISO string by default', async () => {
    const before = Date.now();
    const result = await timestampTool.handler({});
    const after = Date.now();
    const text = result.content[0].text;

    expect(result.content[0].type).toBe('text');
    // ISO format: 2026-05-02T00:00:00.000Z
    expect(text).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

    const parsed = new Date(text).getTime();
    expect(parsed).toBeGreaterThanOrEqual(before);
    expect(parsed).toBeLessThanOrEqual(after);
  });

  it('should return ISO string when format is iso', async () => {
    const result = await timestampTool.handler({ format: 'iso' });
    expect(result.content[0].text).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
  });

  it('should return Unix timestamp when format is unix', async () => {
    const before = Date.now();
    const result = await timestampTool.handler({ format: 'unix' });
    const after = Date.now();
    const text = result.content[0].text;

    expect(result.content[0].type).toBe('text');
    expect(text).toMatch(/^\d+$/);

    const ms = Number(text);
    expect(ms).toBeGreaterThanOrEqual(before);
    expect(ms).toBeLessThanOrEqual(after);
  });
});

describe('envTool', () => {
  const ORIGINAL_PATH = process.env.PATH;

  it('should return the value of an existing env var', async () => {
    const result = await envTool.handler({ key: 'PATH' });
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe(ORIGINAL_PATH);
  });

  it('should return empty string for an unset env var', async () => {
    const result = await envTool.handler({ key: '__MCP_KIT_TEST_UNSET_VAR__' });
    expect(result.content[0].type).toBe('text');
    expect(result.content[0].text).toBe('');
  });
});

describe('uuidTool', () => {
  it('should return a valid UUID v4 string', async () => {
    const result = await uuidTool.handler({});
    expect(result.content[0].type).toBe('text');
    // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    expect(result.content[0].text).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('should generate unique UUIDs on each call', async () => {
    const [a, b, c] = await Promise.all([
      uuidTool.handler({}),
      uuidTool.handler({}),
      uuidTool.handler({}),
    ]);
    const ids = [a.content[0].text, b.content[0].text, c.content[0].text];
    expect(new Set(ids).size).toBe(3);
  });
});
