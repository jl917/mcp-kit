import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadDotEnv, textOf } from '@/common';
import { z } from 'zod';
import {
  movieRecommendationsTool,
  nowPlayingMoviesTool,
  tools,
  upcomingMoviesTool,
} from '@/tools/movie';
import { clearGenreCache, DEFAULT_REGION, TMDB_ENV_KEYS } from '@/tmdb/index';

// rstest는 .env를 읽지 않는다. CI는 워크플로에서 시크릿을 환경 변수로 넣어 주고,
// 로컬에서는 이 한 줄이 저장소 루트의 .env를 읽어 같은 자리를 채운다.
loadDotEnv(resolve(dirname(fileURLToPath(import.meta.url)), '../..'));

/**
 * 모든 필드를 `null`로 채운 입력.
 *
 * 스키마가 필드 생략을 허용하지 않으므로(OpenAI 도구 가이드), 아무 값도 주지
 * 않는다는 뜻은 전부 `null`로 씁니다. CLI가 생략된 자리에 채우는 값과 같습니다.
 */
function nulls(tool: { inputSchema: z.ZodRawShape }): Record<string, null> {
  return Object.fromEntries(Object.keys(tool.inputSchema).map((key) => [key, null]));
}

// 자격 증명이 잡히면 실제 TMDB까지 확인한다. 오프라인이거나 호출을 아끼고 싶으면
// SKIP_TMDB_LIVE_TESTS=1로 이 묶음만 끈다.
const HAS_CREDENTIALS =
  !process.env.SKIP_TMDB_LIVE_TESTS &&
  TMDB_ENV_KEYS.some((key) => Boolean(process.env[key]?.trim()));

describe('tool definitions', () => {
  it('should expose all three tools under MCP snake_case names', () => {
    expect(Object.keys(tools)).toEqual([
      'nowPlayingMoviesTool',
      'upcomingMoviesTool',
      'movieRecommendationsTool',
    ]);
    expect(nowPlayingMoviesTool.name).toBe('movies_now_playing');
    expect(upcomingMoviesTool.name).toBe('movies_upcoming');
    expect(movieRecommendationsTool.name).toBe('movie_recommendations');
  });

  // OpenAI 도구 가이드는 모든 필드를 `required`로 요구하므로 생략은 못 하고
  // `null`로만 비웁니다. 기본값을 채우는 일은 스키마가 아니라 `@/tmdb`가 합니다.
  it('should take null for every field instead of omitting it', () => {
    for (const tool of [nowPlayingMoviesTool, upcomingMoviesTool]) {
      expect(z.object(tool.inputSchema).parse(nulls(tool))).toEqual({
        language: null,
        region: null,
        page: null,
        timeoutMs: null,
      });
      expect(() => z.object(tool.inputSchema).parse({})).toThrow();
    }
  });

  // CLI는 인자를 자리로 받으므로, 앞 인자를 비우려면 null을 넘길 수 있어야 한다.
  it('should accept null for the reference fields so a later argument can be positional', () => {
    const parsed = z
      .object(movieRecommendationsTool.inputSchema)
      .parse({ ...nulls(movieRecommendationsTool), genre: '액션' });
    expect(parsed).toMatchObject({ title: null, movieId: null, genre: '액션' });
  });

  it('should still reject values of the wrong type', () => {
    const schema = z.object(movieRecommendationsTool.inputSchema);
    const base = nulls(movieRecommendationsTool);
    expect(() => schema.parse({ ...base, movieId: 'tt0816692' })).toThrow();
    expect(() => schema.parse({ ...base, page: 'first' })).toThrow();
  });

  // 범위 키워드는 OpenAI 스키마에서 빠졌으므로 도메인이 메워야 한다.
  it('should clamp a page below one in the domain rather than the schema', () => {
    const schema = z.object(nowPlayingMoviesTool.inputSchema);
    expect(schema.parse({ ...nulls(nowPlayingMoviesTool), page: 0 }).page).toBe(0);
  });
});

describe('handlers without credentials', () => {
  const saved = new Map<string, string | undefined>();

  beforeEach(() => {
    clearGenreCache();
    for (const key of TMDB_ENV_KEYS) {
      saved.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const [key, value] of saved) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    saved.clear();
  });

  // 인증이 없으면 네트워크에 나가기 전에 막히고, 호출 쪽은 예외 대신 한 줄을 받는다.
  it.each([
    ['movies_now_playing', nowPlayingMoviesTool],
    ['movies_upcoming', upcomingMoviesTool],
    ['movie_recommendations', movieRecommendationsTool],
  ])('should return an Error line naming the env vars for %s', async (_name, tool) => {
    const parsed = z.object(tool.inputSchema).parse(nulls(tool));
    const output = textOf(await tool.handler(parsed));
    expect(output).toMatch(/^Error: /);
    expect(output).toContain('TMDB_API_KEY');
  });

  // 장르 표를 받지 못한 것을 조용히 넘기면 인증 오류가 "모르는 장르"로 둔갑한다.
  it('should blame the missing credential, not the genre, when filtering by genre name', async () => {
    const parsed = z
      .object(movieRecommendationsTool.inputSchema)
      .parse({ ...nulls(movieRecommendationsTool), genre: '액션' });
    const output = textOf(await movieRecommendationsTool.handler(parsed));
    expect(output).toContain('TMDB_API_KEY');
    expect(output).not.toContain('Unknown genre');
  });
});

// 실제 TMDB 호출. 자격 증명이 없으면 건너뛰므로 기본 테스트 실행은 네트워크를 타지 않는다.
describe.skipIf(!HAS_CREDENTIALS)('live TMDB lookups', () => {
  it('should return now playing movies for the Korean region', async () => {
    const parsed = z.object(nowPlayingMoviesTool.inputSchema).parse(nulls(nowPlayingMoviesTool));
    const body = JSON.parse(textOf(await nowPlayingMoviesTool.handler(parsed)));

    expect(body.kind).toBe('now_playing');
    expect(body.region).toBe(DEFAULT_REGION);
    expect(body.results.length).toBeGreaterThan(0);
    for (const movie of body.results) {
      expect(typeof movie.id).toBe('number');
      expect(movie.tmdbUrl).toContain(String(movie.id));
    }
  }, 30_000);

  it('should recommend movies from a reference title', async () => {
    const parsed = z
      .object(movieRecommendationsTool.inputSchema)
      .parse({ ...nulls(movieRecommendationsTool), title: 'Interstellar', language: 'en-US' });
    const body = JSON.parse(textOf(await movieRecommendationsTool.handler(parsed)));

    expect(body.kind).toBe('similar');
    expect(body.basedOn.id).toBe(157_336);
  }, 30_000);
});
