import { describe, expect, it } from '@rstest/core';
import { titleOf, toMovieSummary } from '@/tmdb/normalize';
import { needsGenreTable, resolveGenreId } from '@/tmdb/genres';

const GENRES = new Map([
  [28, '액션'],
  [878, 'SF'],
]);

describe('toMovieSummary()', () => {
  it('should map a full movie into the response shape', () => {
    expect(
      toMovieSummary(
        {
          id: 157336,
          title: '인터스텔라',
          original_title: 'Interstellar',
          overview: '  줄거리  ',
          release_date: '2014-11-05',
          genre_ids: [878, 28],
          poster_path: '/poster.jpg',
          vote_average: 8.4,
          vote_count: 36_000,
          popularity: 120.5,
        },
        GENRES,
      ),
    ).toEqual({
      id: 157336,
      title: '인터스텔라',
      originalTitle: 'Interstellar',
      releaseDate: '2014-11-05',
      overview: '줄거리',
      genres: ['SF', '액션'],
      voteAverage: 8.4,
      voteCount: 36_000,
      popularity: 120.5,
      posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
      tmdbUrl: 'https://www.themoviedb.org/movie/157336',
    });
  });

  it('should drop genre ids that are not in the table', () => {
    expect(toMovieSummary({ id: 1, genre_ids: [28, 9999] }, GENRES).genres).toEqual(['액션']);
  });

  // TMDB는 번역이 없는 작품에서 title을 비워 보낸다. 그때는 원제로 메운다.
  it('should fall back to the original title when the localized one is blank', () => {
    const summary = toMovieSummary({ id: 2, title: '   ', original_title: 'Dune' }, GENRES);
    expect(summary.title).toBe('Dune');
    expect(summary.originalTitle).toBe('Dune');
  });

  it('should fill missing fields with a fixed shape instead of undefined', () => {
    expect(toMovieSummary({ id: 3 }, GENRES)).toEqual({
      id: 3,
      title: '',
      originalTitle: '',
      releaseDate: null,
      overview: '',
      genres: [],
      voteAverage: 0,
      voteCount: 0,
      popularity: 0,
      posterUrl: null,
      tmdbUrl: 'https://www.themoviedb.org/movie/3',
    });
  });
});

describe('titleOf()', () => {
  it('should use the id when neither title is present', () => {
    expect(titleOf({ id: 42 })).toBe('42');
  });
});

describe('resolveGenreId()', () => {
  it('should return undefined when no genre is requested', () => {
    expect(resolveGenreId(undefined, GENRES)).toBeUndefined();
    expect(resolveGenreId('  ', GENRES)).toBeUndefined();
  });

  it('should pass a numeric genre through without a lookup', () => {
    expect(resolveGenreId('28', new Map())).toBe('28');
  });

  it('should match a genre name regardless of case', () => {
    expect(resolveGenreId('액션', GENRES)).toBe('28');
    expect(resolveGenreId('sf', GENRES)).toBe('878');
  });

  // 못 찾은 장르를 조용히 무시하면 필터 없이 조회한 결과를 장르 추천으로 오해한다.
  it('should fail and list the known genres when the name is unknown', () => {
    expect(() => resolveGenreId('느와르', GENRES)).toThrow(/액션, SF/);
  });
});

describe('needsGenreTable()', () => {
  it('should require the table only for a genre given by name', () => {
    expect(needsGenreTable('액션')).toBe(true);
    expect(needsGenreTable('28')).toBe(false);
    expect(needsGenreTable('')).toBe(false);
    expect(needsGenreTable(undefined)).toBe(false);
  });
});
