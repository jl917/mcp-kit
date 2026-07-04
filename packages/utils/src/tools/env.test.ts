import { describe, expect, it } from '@rstest/core';
import { envGetTool, envGet } from '@/tools/env';

describe('envGet()', () => {
  it('should return matching env vars for valid keys', () => {
    process.env.API_KEY = 'test-key-123';
    try {
      const result = envGet(['API_KEY']);
      expect(result).toEqual({ API_KEY: 'test-key-123' });
    } finally {
      delete process.env.API_KEY;
    }
  });

  it('should omit unset env vars from result', () => {
    delete process.env.API_KEY;
    const result = envGet(['API_KEY']);
    expect(result).toEqual({});
  });

  it('should throw for invalid keys', () => {
    expect(() => envGet(['INVALID_KEY'])).toThrow('Invalid env key');
    expect(() => envGet(['INVALID_KEY'])).toThrow('API_KEY');
  });

  it('should report all invalid keys in error message', () => {
    expect(() => envGet(['A', 'B'])).toThrow('A, B');
  });
});

describe('envGetTool handler', () => {
  it('should return env var value as JSON', async () => {
    process.env.API_KEY = 'my-api-key';
    try {
      const result = await envGetTool.handler({ keys: ['API_KEY'] });
      expect(result.content[0].type).toBe('text');
      const parsed = JSON.parse(result.content[0].text);
      expect(parsed).toEqual({ API_KEY: 'my-api-key' });
    } finally {
      delete process.env.API_KEY;
    }
  });

  it('should return fallback message when no env vars found', async () => {
    delete process.env.API_KEY;
    const result = await envGetTool.handler({ keys: ['API_KEY'] });
    expect(result.content[0].text).toBe('(no matching environment variables found)');
  });

  it('should return error for invalid keys', async () => {
    const result = await envGetTool.handler({ keys: ['INVALID_KEY'] });
    expect(result.content[0].text).toContain('Error:');
    expect(result.content[0].text).toContain('Invalid env key');
    expect(result.content[0].text).toContain('API_KEY');
  });
});
