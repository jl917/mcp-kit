import { defineTool, toolDef, text } from '@/common';
import { z } from 'zod';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_REGION,
  DEFAULT_TIMEOUT_MS,
  fetchNowPlaying,
  fetchRecommendations,
  fetchUpcoming,
} from '@/tmdb/index';

const MOVIE_SHAPE =
  '영화 하나는 ' +
  '{ id, title, originalTitle, releaseDate, overview, genres, voteAverage, voteCount, popularity, posterUrl, tmdbUrl } ' +
  '형태입니다.';

/**
 * 목록 도구가 공유하는 입력 스키마.
 *
 * OpenAI 도구 스키마는 `default`와 정수 범위 키워드를 받지 않고 모든 필드가
 * `required`여야 하므로, 값을 비우는 뜻은 `null`로만 나타냅니다. 기본값은
 * `describe()`로 모델에 알리고 적용은 `@/tmdb`가 맡습니다.
 */
const languageSchema = z
  .string()
  .nullable()
  .describe(`응답 언어 (ISO 639-1 + ISO 3166-1, 예: ko-KR). null이면 ${DEFAULT_LANGUAGE}`);

const regionSchema = z
  .string()
  .nullable()
  .describe(
    `개봉 기준 지역 (ISO 3166-1, 예: KR). 빈 문자열이면 지역을 지정하지 않고, null이면 ${DEFAULT_REGION}`,
  );

const pageSchema = z
  .number()
  .nullable()
  .describe('조회할 페이지 번호. null이면 1이고, 1보다 작은 값은 1로 올림');

const timeoutSchema = z
  .number()
  .nullable()
  .describe(`요청 하나에 허용할 시간(ms). null이거나 0 이하면 ${DEFAULT_TIMEOUT_MS}`);

const listSchema = {
  language: languageSchema,
  region: regionSchema,
  page: pageSchema,
  timeoutMs: timeoutSchema,
};

export const tools = {
  nowPlayingMoviesTool: toolDef({
    name: 'movies_now_playing',
    description:
      'TMDB에서 현재 상영 중인 영화 목록을 가져와 JSON으로 반환합니다. ' +
      `${MOVIE_SHAPE} dates에 집계 기간이 함께 담깁니다`,
    inputSchema: { ...listSchema },
    handler: async ({ language, region, page, timeoutMs }) => {
      try {
        return text(
          JSON.stringify(
            await fetchNowPlaying({
              language: language ?? undefined,
              region: region ?? undefined,
              page: page ?? undefined,
              timeoutMs: timeoutMs ?? undefined,
            }),
            null,
            2,
          ),
        );
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
  }),

  upcomingMoviesTool: toolDef({
    name: 'movies_upcoming',
    description:
      'TMDB에서 개봉 예정 영화 목록을 가져와 JSON으로 반환합니다. ' +
      `${MOVIE_SHAPE} dates에 집계 기간이 함께 담깁니다`,
    inputSchema: { ...listSchema },
    handler: async ({ language, region, page, timeoutMs }) => {
      try {
        return text(
          JSON.stringify(
            await fetchUpcoming({
              language: language ?? undefined,
              region: region ?? undefined,
              page: page ?? undefined,
              timeoutMs: timeoutMs ?? undefined,
            }),
            null,
            2,
          ),
        );
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
  }),

  movieRecommendationsTool: toolDef({
    name: 'movie_recommendations',
    description:
      'TMDB에서 추천 영화 목록을 가져와 JSON으로 반환합니다. ' +
      '기준 영화를 주면 그 영화 기반 추천(kind: "similar")을, 주지 않으면 이미 개봉한 인기작(kind: "discover")을 돌려줍니다. ' +
      MOVIE_SHAPE,
    inputSchema: {
      title: z
        .string()
        .nullable()
        .describe('기준 영화 제목. 검색해서 첫 결과를 기준으로 삼고, null이면 기준 없이 추천'),
      movieId: z
        .number()
        .nullable()
        .describe('기준 영화의 TMDB id. title보다 우선하고, null이면 title을 봄'),
      genre: z
        .string()
        .nullable()
        .describe('기준 영화 없이 추천할 때만 적용할 장르 이름 또는 id (예: 액션, 28)'),
      ...listSchema,
    },
    handler: async ({ title, movieId, genre, language, region, page, timeoutMs }) => {
      try {
        const result = await fetchRecommendations({
          title: title ?? undefined,
          movieId: movieId ?? undefined,
          genre: genre ?? undefined,
          language: language ?? undefined,
          region: region ?? undefined,
          page: page ?? undefined,
          timeoutMs: timeoutMs ?? undefined,
        });
        return text(JSON.stringify(result, null, 2));
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
  }),
};

export const nowPlayingMoviesTool = defineTool(tools.nowPlayingMoviesTool);
export const upcomingMoviesTool = defineTool(tools.upcomingMoviesTool);
export const movieRecommendationsTool = defineTool(tools.movieRecommendationsTool);
