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

const RETURN_TYPE =
  '{ kind, language, region, page, totalPages, totalResults, dates, basedOn, results: MovieSummary[] }';

const GUIDELINES = [
  'TMDB_API_KEY(v3 API 키) 또는 TMDB_ACCESS_TOKEN(읽기 액세스 토큰) 중 하나를 환경 변수로 넣어야 합니다.',
  '기본값은 language=ko-KR, region=KR입니다. 한국 개봉 기준이 아니면 region을 바꾸고, 지역을 빼려면 빈 문자열을 넘깁니다.',
  '한 페이지는 최대 20편입니다. 더 필요하면 page를 올려 다시 호출합니다.',
  'genres는 TMDB 장르 목록을 언어별로 한 번 받아 이름으로 바꾼 값이고, 장르 목록을 받지 못하면 빈 배열입니다.',
  'dates는 상영 중·개봉 예정 목록에만 있고 나머지는 null입니다.',
  '인증 실패·조회 실패는 예외 대신 "Error: ..." 한 줄로 돌아옵니다.',
];

const languageSchema = z
  .string()
  .default(DEFAULT_LANGUAGE)
  .describe('응답 언어 (ISO 639-1 + ISO 3166-1, 예: ko-KR)');

const regionSchema = z
  .string()
  .default(DEFAULT_REGION)
  .describe('개봉 기준 지역 (ISO 3166-1, 예: KR). 빈 문자열이면 지역을 지정하지 않음');

const pageSchema = z.number().int().positive().default(1).describe('조회할 페이지 번호');

const timeoutSchema = z
  .number()
  .int()
  .positive()
  .default(DEFAULT_TIMEOUT_MS)
  .describe('요청 하나에 허용할 시간(ms)');

const LIST_TYPE_LABELS = {
  language: 'string',
  region: 'string',
  page: 'number',
  timeoutMs: 'number',
};

export const tools = {
  nowPlayingMoviesTool: toolDef({
    name: 'movies_now_playing',
    description:
      'TMDB에서 현재 상영 중인 영화 목록을 가져와 JSON으로 반환합니다. ' +
      `${MOVIE_SHAPE} dates에 집계 기간이 함께 담깁니다`,
    inputSchema: {
      language: languageSchema,
      region: regionSchema,
      page: pageSchema,
      timeoutMs: timeoutSchema,
    },
    typeLabels: LIST_TYPE_LABELS,
    returnType: RETURN_TYPE,
    returnDescription: '상영 중인 영화 목록 JSON. basedOn은 항상 null',
    handler: async ({ language, region, page, timeoutMs }) => {
      try {
        return text(
          JSON.stringify(await fetchNowPlaying({ language, region, page, timeoutMs }), null, 2),
        );
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
    examples: [
      {
        args: ['ko-KR', 'KR'],
        result: '{"kind":"now_playing","language":"ko-KR","region":"KR","page":1,...}',
      },
    ],
    guidelines: GUIDELINES,
  }),

  upcomingMoviesTool: toolDef({
    name: 'movies_upcoming',
    description:
      'TMDB에서 개봉 예정 영화 목록을 가져와 JSON으로 반환합니다. ' +
      `${MOVIE_SHAPE} dates에 집계 기간이 함께 담깁니다`,
    inputSchema: {
      language: languageSchema,
      region: regionSchema,
      page: pageSchema,
      timeoutMs: timeoutSchema,
    },
    typeLabels: LIST_TYPE_LABELS,
    returnType: RETURN_TYPE,
    returnDescription: '개봉 예정 영화 목록 JSON. basedOn은 항상 null',
    handler: async ({ language, region, page, timeoutMs }) => {
      try {
        return text(
          JSON.stringify(await fetchUpcoming({ language, region, page, timeoutMs }), null, 2),
        );
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
    examples: [
      {
        args: ['ko-KR', 'KR'],
        result: '{"kind":"upcoming","language":"ko-KR","region":"KR","page":1,...}',
      },
    ],
    guidelines: GUIDELINES,
  }),

  movieRecommendationsTool: toolDef({
    name: 'movie_recommendations',
    description:
      'TMDB에서 추천 영화 목록을 가져와 JSON으로 반환합니다. ' +
      '기준 영화를 주면 그 영화 기반 추천(kind: "similar")을, 주지 않으면 이미 개봉한 인기작(kind: "discover")을 돌려줍니다. ' +
      MOVIE_SHAPE,
    inputSchema: {
      title: z.string().nullish().describe('기준 영화 제목. 검색해서 첫 결과를 기준으로 삼음'),
      movieId: z
        .number()
        .int()
        .positive()
        .nullish()
        .describe('기준 영화의 TMDB id. title보다 우선함'),
      genre: z
        .string()
        .nullish()
        .describe('기준 영화 없이 추천할 때만 적용할 장르 이름 또는 id (예: 액션, 28)'),
      language: languageSchema,
      region: regionSchema,
      page: pageSchema,
      timeoutMs: timeoutSchema,
    },
    typeLabels: {
      title: 'string',
      movieId: 'number',
      genre: 'string',
      ...LIST_TYPE_LABELS,
    },
    returnType: RETURN_TYPE,
    returnDescription:
      '추천 영화 목록 JSON. similar 추천이면 basedOn에 기준 영화의 { id, title }이 담김',
    handler: async ({ title, movieId, genre, language, region, page, timeoutMs }) => {
      try {
        const result = await fetchRecommendations({
          title: title ?? undefined,
          movieId: movieId ?? undefined,
          genre: genre ?? undefined,
          language,
          region,
          page,
          timeoutMs,
        });
        return text(JSON.stringify(result, null, 2));
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
    examples: [
      {
        args: ['"인터스텔라"'],
        result: '{"kind":"similar","basedOn":{"id":157336,"title":"인터스텔라"},...}',
      },
      {
        args: ['null', 'null', '"액션"'],
        result: '{"kind":"discover","basedOn":null,"page":1,...}',
      },
    ],
    guidelines: [
      ...GUIDELINES,
      'title과 movieId를 모두 비우면 기준 없이 이미 개봉한 인기작을 돌려줍니다.',
      'genre는 기준 영화가 없을 때만 적용됩니다. 기준 영화를 주면 TMDB 추천 목록을 그대로 씁니다.',
    ],
  }),
};

export const nowPlayingMoviesTool = defineTool(tools.nowPlayingMoviesTool);
export const upcomingMoviesTool = defineTool(tools.upcomingMoviesTool);
export const movieRecommendationsTool = defineTool(tools.movieRecommendationsTool);
