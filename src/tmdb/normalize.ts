import { TMDB_IMAGE_BASE_URL, TMDB_MOVIE_URL, type MovieSummary, type TmdbMovie } from './types';

/**
 * TMDB 원본 영화 객체를 도구 응답 형태로 옮깁니다.
 *
 * TMDB는 번역이 없는 작품에서 `title`·`overview`를 비워 보내므로, 비어 있는
 * 필드는 원제나 빈 값으로 메워 응답 모양을 항상 같게 유지합니다.
 */
export function toMovieSummary(raw: TmdbMovie, genres: Map<number, string>): MovieSummary {
  const originalTitle = raw.original_title?.trim() ?? '';
  const title = raw.title?.trim() || originalTitle;

  return {
    id: raw.id,
    title,
    originalTitle: originalTitle || title,
    releaseDate: raw.release_date?.trim() || null,
    overview: raw.overview?.trim() ?? '',
    genres: (raw.genre_ids ?? [])
      .map((id) => genres.get(id))
      .filter((name): name is string => Boolean(name)),
    voteAverage: raw.vote_average ?? 0,
    voteCount: raw.vote_count ?? 0,
    popularity: raw.popularity ?? 0,
    posterUrl: raw.poster_path ? `${TMDB_IMAGE_BASE_URL}${raw.poster_path}` : null,
    tmdbUrl: `${TMDB_MOVIE_URL}/${raw.id}`,
  };
}

/** 영화 제목을 고릅니다. 번역도 원제도 없으면 id를 문자열로 씁니다. */
export function titleOf(raw: TmdbMovie): string {
  return raw.title?.trim() || raw.original_title?.trim() || String(raw.id);
}
