export { fetchNowPlaying, fetchUpcoming, fetchRecommendations } from './movies';
export type { ListOptions, RecommendOptions } from './movies';
export { buildRequest, EMBEDDED_AUTH, resolveAuth, tmdbGet, TMDB_ENV_KEYS } from './client';
export type { QueryParams, TmdbAuth } from './client';
export {
  EMBEDDED_TMDB_ACCESS_TOKEN,
  EMBEDDED_TMDB_API_KEY,
  hasEmbeddedCredentials,
} from './embedded';
export {
  clearGenreCache,
  fetchGenreMap,
  needsGenreTable,
  requireGenreMap,
  resolveGenreId,
} from './genres';
export { toMovieSummary } from './normalize';
export {
  DEFAULT_LANGUAGE,
  DEFAULT_REGION,
  DEFAULT_TIMEOUT_MS,
  MIN_VOTE_COUNT,
  MOVIE_LISTS,
} from './types';
export type {
  MovieListKind,
  MovieListResult,
  MovieSummary,
  RecommendationMode,
  TmdbMovie,
  TmdbPage,
} from './types';
