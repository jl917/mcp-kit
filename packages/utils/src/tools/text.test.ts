import { describe, expect, it } from '@rstest/core';
import { textOf } from '@common';
import { cnTool, caseConvertTool, truncateTool } from '@/tools/text';

describe('cnTool', () => {
  it('should merge class names', async () => {
    const result = await cnTool.handler({ classes: ['btn', 'active', 'large'] });
    expect(result.content[0]).toEqual({ type: 'text', text: 'btn active large' });
  });

  it('should handle a single class', async () => {
    const result = await cnTool.handler({ classes: ['btn'] });
    expect(textOf(result)).toBe('btn');
  });

  it('should handle empty array', async () => {
    const result = await cnTool.handler({ classes: [] });
    expect(textOf(result)).toBe('');
  });
});

describe('caseConvertTool', () => {
  it('should convert to upper', async () => {
    const result = await caseConvertTool.handler({ input: 'hello world', to: 'upper' });
    expect(textOf(result)).toBe('HELLO WORLD');
  });

  it('should convert to lower', async () => {
    const result = await caseConvertTool.handler({ input: 'HELLO WORLD', to: 'lower' });
    expect(textOf(result)).toBe('hello world');
  });

  it('should capitalize', async () => {
    const result = await caseConvertTool.handler({ input: 'hello world', to: 'capitalize' });
    expect(textOf(result)).toBe('Hello world');
  });

  it('should convert to camelCase', async () => {
    const result = await caseConvertTool.handler({ input: 'hello-world', to: 'camel' });
    expect(textOf(result)).toBe('helloWorld');
  });

  it('should convert to snake_case', async () => {
    const result = await caseConvertTool.handler({ input: 'helloWorld', to: 'snake' });
    expect(textOf(result)).toBe('hello_world');
  });

  it('should convert to kebab-case', async () => {
    const result = await caseConvertTool.handler({ input: 'helloWorld', to: 'kebab' });
    expect(textOf(result)).toBe('hello-world');
  });
});

describe('truncateTool', () => {
  it('should not truncate text within maxLength', async () => {
    const result = await truncateTool.handler({ input: 'short', maxLength: 10 });
    expect(textOf(result)).toBe('short');
  });

  it('should truncate and append default suffix', async () => {
    const result = await truncateTool.handler({
      input: 'hello world long text',
      maxLength: 10,
      suffix: '...',
    });
    expect(textOf(result)).toBe('hello w...');
  });

  it('should use custom suffix', async () => {
    const result = await truncateTool.handler({
      input: 'hello world',
      maxLength: 8,
      suffix: '…',
    });
    expect(textOf(result)).toBe('hello w…');
  });

  it('should handle text equal to maxLength', async () => {
    const result = await truncateTool.handler({ input: 'hello', maxLength: 5 });
    expect(textOf(result)).toBe('hello');
  });

  it('should handle empty input', async () => {
    const result = await truncateTool.handler({ input: '', maxLength: 5 });
    expect(textOf(result)).toBe('');
  });
});
