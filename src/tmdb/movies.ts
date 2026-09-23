import { tmdbGet, type QueryParams, type TmdbAuth } from './client';
import { fetchGenreMap, needsGenreTable, requireGenreMap, resolveGenreId } from './genres';
import { titleOf, toMovieSummary } from './normalize';
import {
  DEFAULT_LANGUAGE,
  DEFAULT_REGION,
  DEFAULT_TIMEOUT_MS,
  MIN_VOTE_COUNT,
  type MovieListKind,
  type MovieListResult,
  type RecommendationMode,
  type TmdbMovie,
  type TmdbPage,
} from './types';

export interface ListOptions {
  /** 응답 언어. 기본값 `ko-KR` */
  language?: string;
  /** 개봉 기준 지역. 빈 문자열이면 지역을 지정하지 않습니다. 기본값 `KR` */
  region?: string;
  page?: number;
  timeoutMs?: number;
  /** 직접 넘긴 인증 정보. 생략하면 환경 변수에서 읽습니다. */
  auth?: TmdbAuth;
}

export interface RecommendOptions extends ListOptions {
  /** 기준 영화 제목. `movieId`가 있으면 무시됩니다. */
  title?: string;
  /** 기준 영화의 TMDB id. */
  movieId?: number;
  /** 기준 영화 없이 추천할 때만 적용할 장르 이름 또는 id. */
  genre?: string;
}

/** 현재 상영 중인 영화 목록을 가져옵니다. */
export async function fetchNowPlaying(options: ListOptions = {}): Promise<MovieListResult> {
  return fetchList('now_playing', options);
}

/** 개봉 예정 영화 목록을 가져옵니다. */
export async function fetchUpcoming(options: ListOptions = {}): Promise<MovieListResult> {
  return fetchList('upcoming', options);
}

/**
 * 추천 영화를 가져옵니다.
 *
 * 기준 영화(`movieId` 또는 `title`)를 주면 그 영화의 TMDB 추천 목록을, 주지
 * 않으면 이미 개봉한 영화 중 인기순 목록을 돌려줍니다.
 *
 * @throws 제목으로 기준 영화를 찾지 못했거나 장르 이름이 표에 없는 경우
 */
export async function fetchRecommendations(
  options: RecommendOptions = {},
): Promise<MovieListResult> {
  const { language, region, page, timeoutMs, auth } = normalize(options);
  const base = await resolveBaseMovie(options, language, region, timeoutMs, auth);

  // 장르 이름으로 걸러야 하면 표를 반드시 받아야 한다. 이때 실패를 삼키면
  // 인증 오류가 "모르는 장르"로 둔갑해 원인을 숨긴다.
  const genres =
    !base && needsGenreTable(options.genre)
      ? await requireGenreMap(language, timeoutMs, auth)
      : await fetchGenreMap(language, timeoutMs, auth);

  if (base) {
    const body = await tmdbGet<TmdbPage<TmdbMovie>>(
      `/movie/${base.id}/recommendations`,
      { language, page },
      timeoutMs,
      auth,
    );
    return toResult('similar', body, genres, language, region, base);
  }

  const body = await tmdbGet<TmdbPage<TmdbMovie>>(
    '/discover/movie',
    {
      language,
      region: region ?? undefined,
      page,
      sort_by: 'popularity.desc',
      include_adult: false,
      // 이미 개봉한 작품만 남겨 "기존 영화" 추천이 개봉 예정작과 겹치지 않게 한다.
      'primary_release_date.lte': today(),
      'vote_count.gte': MIN_VOTE_COUNT,
      with_genres: resolveGenreId(options.genre, genres),
    } satisfies QueryParams,
    timeoutMs,
    auth,
  );
  return toResult('discover', body, genres, language, region, null);
}

async function fetchList(kind: MovieListKind, options: ListOptions): Promise<MovieListResult> {
  const { language, region, page, timeoutMs, auth } = normalize(options);
  const body = await tmdbGet<TmdbPage<TmdbMovie>>(
    `/movie/${kind}`,
    { language, region: region ?? undefined, page },
    timeoutMs,
    auth,
  );
  const genres = await fetchGenreMap(language, timeoutMs, auth);
  return toResult(kind, body, genres, language, region, null);
}

/**
 * 추천의 기준이 될 영화를 정합니다.
 *
 * id를 주면 상세를 한 번 읽어 제목을 확인하고, 제목만 주면 검색해서 첫 결과를
 * 씁니다. 둘 다 없으면 기준 없이 추천하라는 뜻입니다.
 *
 * @returns 기준 영화. 기준을 주지 않았으면 `null`
 * @throws 제목에 맞는 영화를 찾지 못한 경우
 */
async function resolveBaseMovie(
  options: RecommendOptions,
  language: string,
  region: string | null,
  timeoutMs: number,
  auth?: TmdbAuth,
): Promise<{ id: number; title: string } | null> {
  if (options.movieId) {
    const detail = await tmdbGet<TmdbMovie>(
      `/movie/${options.movieId}`,
      { language },
      timeoutMs,
      auth,
    );
    return { id: detail.id, title: titleOf(detail) };
  }

  const query = options.title?.trim();
  if (!query) return null;

  const found = await tmdbGet<TmdbPage<TmdbMovie>>(
    '/search/movie',
    { query, language, region: region ?? undefined, page: 1 },
    timeoutMs,
    auth,
  );
  const first = found.results?.[0];
  if (!first) throw new Error(`No movie matched "${query}"`);
  return { id: first.id, title: titleOf(first) };
}

function toResult(
  kind: MovieListKind | RecommendationMode,
  body: TmdbPage<TmdbMovie>,
  genres: Map<number, string>,
  language: string,
  region: string | null,
  basedOn: { id: number; title: string } | null,
): MovieListResult {
  return {
    kind,
    language,
    region,
    page: body.page ?? 1,
    totalPages: body.total_pages ?? 0,
    totalResults: body.total_results ?? 0,
    dates: body.dates
      ? { minimum: body.dates.minimum ?? null, maximum: body.dates.maximum ?? null }
      : null,
    basedOn,
    results: (body.results ?? []).map((raw) => toMovieSummary(raw, genres)),
  };
}

/** 빈 값을 기본값으로 메웁니다. `region`은 빈 문자열을 "지역 없음"으로 봅니다. */
function normalize(options: ListOptions): {
  language: string;
  region: string | null;
  page: number;
  timeoutMs: number;
  auth?: TmdbAuth;
} {
  return {
    language: options.language?.trim() || DEFAULT_LANGUAGE,
    region: options.region === undefined ? DEFAULT_REGION : options.region.trim() || null,
    page: Math.max(1, Math.trunc(options.page ?? 1)),
    timeoutMs: options.timeoutMs && options.timeoutMs > 0 ? options.timeoutMs : DEFAULT_TIMEOUT_MS,
    auth: options.auth,
  };
}

/** 오늘 날짜를 TMDB가 받는 `YYYY-MM-DD`로 돌려줍니다. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}
