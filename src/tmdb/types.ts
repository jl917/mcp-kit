/** TMDB v3 API 기본 주소. */
export const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/** 포스터 이미지 기본 주소. `w500`은 TMDB가 제공하는 표준 너비 중 하나입니다. */
export const TMDB_IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w500';

/** 영화 상세 페이지 기본 주소. */
export const TMDB_MOVIE_URL = 'https://www.themoviedb.org/movie';

/** 응답 언어 기본값. */
export const DEFAULT_LANGUAGE = 'ko-KR';

/** 개봉 정보를 볼 기준 지역 기본값. */
export const DEFAULT_REGION = 'KR';

/** 요청 하나에 허용할 시간. */
export const DEFAULT_TIMEOUT_MS = 10_000;

/**
 * 인기순 추천에서 요구하는 최소 평점 수.
 *
 * TMDB의 `popularity`는 표본이 적은 작품도 크게 튀어 오르므로, 평가가 일정
 * 수 이상 쌓인 작품만 남겨야 "기존 영화 추천"이 실제로 알려진 작품이 됩니다.
 */
export const MIN_VOTE_COUNT = 200;

/** 날짜로 조회하는 목록 종류 — 상영 중 / 개봉 예정. */
export const MOVIE_LISTS = ['now_playing', 'upcoming'] as const;

export type MovieListKind = (typeof MOVIE_LISTS)[number];

/** 추천 방식 — 기준 영화가 있으면 `similar`, 없으면 `discover`. */
export type RecommendationMode = 'similar' | 'discover';

/** TMDB가 내려주는 영화 객체 중 이 도구가 읽는 필드. */
export interface TmdbMovie {
  id: number;
  title?: string;
  original_title?: string;
  overview?: string;
  release_date?: string;
  genre_ids?: number[];
  poster_path?: string | null;
  vote_average?: number;
  vote_count?: number;
  popularity?: number;
}

/** TMDB 목록 응답의 공통 형태. `dates`는 상영 중/개봉 예정 목록에만 있습니다. */
export interface TmdbPage<T> {
  page?: number;
  results?: T[];
  total_pages?: number;
  total_results?: number;
  dates?: { minimum?: string; maximum?: string };
}

/** 도구가 돌려주는 영화 한 편. */
export interface MovieSummary {
  id: number;
  title: string;
  originalTitle: string;
  /** `YYYY-MM-DD`. 개봉일이 없으면 `null` */
  releaseDate: string | null;
  overview: string;
  /** 장르 id를 이름으로 바꾼 값. 이름을 찾지 못한 장르는 빠집니다. */
  genres: string[];
  voteAverage: number;
  voteCount: number;
  popularity: number;
  posterUrl: string | null;
  tmdbUrl: string;
}

/** 도구가 돌려주는 목록 응답. */
export interface MovieListResult {
  kind: MovieListKind | RecommendationMode;
  language: string;
  /** 지역을 지정하지 않았으면 `null`. */
  region: string | null;
  page: number;
  totalPages: number;
  totalResults: number;
  /** 상영 중/개봉 예정 목록이 알려 주는 집계 기간. 그 외에는 `null` */
  dates: { minimum: string | null; maximum: string | null } | null;
  /** `similar` 추천의 기준이 된 영화. `discover`면 `null` */
  basedOn: { id: number; title: string } | null;
  results: MovieSummary[];
}
