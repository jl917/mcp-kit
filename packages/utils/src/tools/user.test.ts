import { describe, expect, it } from '@rstest/core';
import { textOf } from '@common';
import { getUserTool, getUser } from '@/tools/user';

describe('getUser()', () => {
  it('should return a Korean sentence from a valid user object', () => {
    const user = {
      name: { title: 'Mr', first: 'Alice', last: 'Kim' },
      location: { city: 'Seoul' },
    } as any;
    const result = getUser(user);
    expect(result).toBe('이름은 Alice Kim 이고 현재 Seoul 에 살고 있습니다.');
  });

  it('should parse a JSON string input', () => {
    const json = JSON.stringify({
      name: { title: 'Mr', first: 'Bob', last: 'Park' },
      location: { city: 'Busan' },
    });
    const result = getUser(json);
    expect(result).toBe('이름은 Bob Park 이고 현재 Busan 에 살고 있습니다.');
  });

  it('should handle Korean names and city names', () => {
    const user = {
      name: { title: 'Mr', first: '철수', last: '김' },
      location: { city: '서울' },
    } as any;
    const result = getUser(user);
    expect(result).toBe('이름은 철수 김 이고 현재 서울 에 살고 있습니다.');
  });
});

describe('getUserTool handler', () => {
  it('should handle JSON string input', async () => {
    const json = JSON.stringify({
      name: { title: 'Mr', first: 'Alice', last: 'Kim' },
      location: { city: 'Seoul' },
      gender: 'female',
      email: 'alice@example.com',
      nat: 'KR',
    });
    const result = await getUserTool.handler({ user: json });
    expect(result.content[0].type).toBe('text');
    expect(textOf(result)).toBe('이름은 Alice Kim 이고 현재 Seoul 에 살고 있습니다.');
  });

  it('should handle parsed object input', async () => {
    const result = await getUserTool.handler({
      user: {
        name: { title: 'Ms', first: 'Bob', last: 'Park' },
        location: { city: 'Busan' },
        gender: 'male',
      },
    });
    expect(textOf(result)).toBe('이름은 Bob Park 이고 현재 Busan 에 살고 있습니다.');
  });

  it('should return error for invalid JSON string', async () => {
    const result = await getUserTool.handler({ user: 'not valid json' });
    expect(textOf(result)).toContain('Error:');
    expect(textOf(result)).toContain('invalid JSON');
  });

  it('should return error when required fields are missing', async () => {
    const result = await getUserTool.handler({
      user: JSON.stringify({ foo: 'bar' }),
    });
    expect(textOf(result)).toContain('Error:');
  });
});
