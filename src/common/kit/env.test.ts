import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadDotEnv, pickEnv } from '@/common/kit/env';

describe('pickEnv()', () => {
  const env = { A: 'one', B: '   ', C: 'three' } as NodeJS.ProcessEnv;

  it('should keep only the requested keys that hold a value', () => {
    expect(pickEnv(['A', 'C'], env)).toEqual({ A: 'one', C: 'three' });
  });

  // 빈 값을 넘기면 서버 쪽에서 "설정은 됐는데 비어 있다"가 되어 원인이 흐려진다.
  it('should drop blank and missing keys instead of passing an empty string', () => {
    expect(pickEnv(['B', 'MISSING'], env)).toEqual({});
  });

  it('should return an empty object when no key is requested', () => {
    expect(pickEnv([], env)).toEqual({});
  });
});

describe('loadDotEnv()', () => {
  let dir: string;
  const saved = new Map<string, string | undefined>();

  const remember = (...keys: string[]) => {
    for (const key of keys) saved.set(key, process.env[key]);
  };

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'mcp-kit-env-'));
  });

  afterEach(() => {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    saved.clear();
    rmSync(dir, { recursive: true, force: true });
  });

  it('should read the .env file next to the given directory', () => {
    remember('MCP_KIT_TEST_FROM_FILE');
    writeFileSync(join(dir, '.env'), 'MCP_KIT_TEST_FROM_FILE=loaded\n');

    expect(loadDotEnv(dir)).toBe(true);
    expect(process.env.MCP_KIT_TEST_FROM_FILE).toBe('loaded');
  });

  // 셸에서 한 번만 덮어써 돌리는 방식(`TMDB_API_KEY=... pnpm start`)이 살아 있어야 한다.
  it('should leave a variable that is already set in the environment', () => {
    remember('MCP_KIT_TEST_PRESET');
    process.env.MCP_KIT_TEST_PRESET = 'from_shell';
    writeFileSync(join(dir, '.env'), 'MCP_KIT_TEST_PRESET=from_file\n');

    loadDotEnv(dir);
    expect(process.env.MCP_KIT_TEST_PRESET).toBe('from_shell');
  });

  // npx로 받은 서버는 .env가 없는 디렉터리에서 도는 쪽이 정상이다.
  it('should report a miss without throwing when there is no .env', () => {
    expect(loadDotEnv(dir)).toBe(false);
  });
});
