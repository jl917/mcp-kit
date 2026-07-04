import { describe, expect, it } from '@rstest/core';
import { textOf } from '@common';
import { objectFlattenTool, flatten } from '@/tools/deep';

describe('flatten()', () => {
  it('should flatten a simple nested object', () => {
    const result = flatten({ a: { b: { c: 1 } }, d: 2 });
    expect(result).toEqual({ 'a.b.c': 1, d: 2 });
  });

  it('should flatten a JSON string', () => {
    const result = flatten('{"a":{"b":1}}');
    expect(result).toEqual({ 'a.b': 1 });
  });

  it('should treat arrays as leaf values', () => {
    const result = flatten({ a: { b: [1, 2, 3] } });
    expect(result).toEqual({ 'a.b': [1, 2, 3] });
  });

  it('should treat primitives as leaf values', () => {
    const result = flatten({ a: null, b: true, c: 'hello', d: 42 });
    expect(result).toEqual({ a: null, b: true, c: 'hello', d: 42 });
  });

  it('should handle empty object', () => {
    const result = flatten({});
    expect(result).toEqual({});
  });

  it('should handle deeply nested objects with no depth limit', () => {
    const result = flatten({ a: { b: { c: { d: { e: 'deep' } } } } });
    expect(result).toEqual({ 'a.b.c.d.e': 'deep' });
  });
});

describe('objectFlattenTool handler', () => {
  it('should flatten a JSON string input', async () => {
    const result = await objectFlattenTool.handler({
      json: '{"user":{"name":"Alice","address":{"city":"Seoul"}},"active":true}',
    });
    expect(result.content[0].type).toBe('text');
    const parsed = JSON.parse(textOf(result));
    expect(parsed).toEqual({
      'user.name': 'Alice',
      'user.address.city': 'Seoul',
      active: true,
    });
  });

  it('should flatten a parsed object input', async () => {
    const result = await objectFlattenTool.handler({
      json: { user: { name: 'Alice' } },
    });
    const parsed = JSON.parse(textOf(result));
    expect(parsed).toEqual({ 'user.name': 'Alice' });
  });

  it('should return error for invalid JSON string', async () => {
    const result = await objectFlattenTool.handler({
      json: 'not valid json',
    });
    expect(textOf(result)).toContain('Error:');
    expect(textOf(result)).toContain('invalid JSON');
  });
});
