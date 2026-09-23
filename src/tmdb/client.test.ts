import { describe, expect, it } from '@rstest/core';
import { buildRequest, EMBEDDED_AUTH, resolveAuth, TMDB_ENV_KEYS } from '@/tmdb/client';

const NO_ENV = {} as NodeJS.ProcessEnv;

describe('resolveAuth()', () => {
  it('should read both credential forms from the environment', () => {
    expect(
      resolveAuth({ TMDB_API_KEY: 'key', TMDB_ACCESS_TOKEN: 'token' } as NodeJS.ProcessEnv),
    ).toEqual({ apiKey: 'key', accessToken: 'token' });
  });

  it('should fall back to the credential embedded at build time', () => {
    expect(resolveAuth(NO_ENV, { apiKey: 'built-in' })).toEqual({
      apiKey: 'built-in',
      accessToken: undefined,
    });
  });

  // 키와 토큰을 서로 다른 출처에서 섞으면 buildRequest()가 토큰을 먼저 골라
  // 사용자가 넣은 키가 조용히 무시된다. 그래서 출처를 통째로 고른다.
  it('should ignore the embedded credential once the environment supplies one', () => {
    expect(
      resolveAuth({ TMDB_API_KEY: 'from-env' } as NodeJS.ProcessEnv, { accessToken: 'built-in' }),
    ).toEqual({ apiKey: 'from-env', accessToken: undefined });
  });

  it('should report no credential when neither source has one', () => {
    expect(resolveAuth(NO_ENV, {})).toEqual({ apiKey: undefined, accessToken: undefined });
    // 자격 증명을 심지 않은 빌드 — 테스트에는 `define`이 적용되지 않으므로 그 상태다.
    expect(EMBEDDED_AUTH).toEqual({ apiKey: undefined, accessToken: undefined });
  });

  it('should trim values and treat blank ones as missing', () => {
    expect(
      resolveAuth({ TMDB_API_KEY: '  key  ', TMDB_ACCESS_TOKEN: '   ' } as NodeJS.ProcessEnv),
    ).toEqual({ apiKey: 'key', accessToken: undefined });
  });

  it('should name both accepted env vars', () => {
    expect([...TMDB_ENV_KEYS]).toEqual(['TMDB_API_KEY', 'TMDB_ACCESS_TOKEN']);
  });
});

describe('buildRequest()', () => {
  it('should put a v3 API key in the query string', () => {
    const { url, headers } = buildRequest('/movie/now_playing', { page: 1 }, { apiKey: 'key' });
    expect(url).toBe('https://api.themoviedb.org/3/movie/now_playing?page=1&api_key=key');
    expect(headers.authorization).toBeUndefined();
  });

  // 토큰이 있으면 비밀값이 URL에 남지 않도록 헤더 인증만 쓴다.
  it('should prefer the bearer header and keep the key out of the URL', () => {
    const { url, headers } = buildRequest(
      '/movie/upcoming',
      {},
      { apiKey: 'key', accessToken: 'token' },
    );
    expect(url).toBe('https://api.themoviedb.org/3/movie/upcoming');
    expect(headers.authorization).toBe('Bearer token');
  });

  it('should drop undefined and blank parameters', () => {
    const { url } = buildRequest(
      '/discover/movie',
      { language: 'ko-KR', region: undefined, with_genres: '' },
      { accessToken: 'token' },
    );
    expect(url).toBe('https://api.themoviedb.org/3/discover/movie?language=ko-KR');
  });

  it('should encode parameter values', () => {
    const { url } = buildRequest('/search/movie', { query: '인터스텔라' }, { apiKey: 'key' });
    expect(url).toContain(`query=${encodeURIComponent('인터스텔라')}`);
  });

  it('should fail with a message naming both env vars when no credential is set', () => {
    expect(() => buildRequest('/movie/now_playing', {}, {})).toThrow(/TMDB_API_KEY/);
    expect(() => buildRequest('/movie/now_playing', {}, {})).toThrow(/TMDB_ACCESS_TOKEN/);
  });
});
