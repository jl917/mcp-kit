import { tmdbGet, type TmdbAuth } from './client';

interface GenreListResponse {
  genres?: { id: number; name: string }[];
}

// 장르 목록은 언어별로 고정이라 프로세스가 사는 동안 다시 받을 이유가 없다.
const cache = new Map<string, Map<number, string>>();

/**
 * 장르 id를 이름으로 바꾸는 표를 받아 옵니다. 언어별로 한 번만 받아 둡니다.
 *
 * @throws 목록을 받지 못한 경우
 */
export async function requireGenreMap(
  language: string,
  timeoutMs: number,
  auth?: TmdbAuth,
): Promise<Map<number, string>> {
  const cached = cache.get(language);
  if (cached) return cached;

  const body = await tmdbGet<GenreListResponse>('/genre/movie/list', { language }, timeoutMs, auth);
  const map = new Map((body.genres ?? []).map((genre) => [genre.id, genre.name] as const));
  cache.set(language, map);
  return map;
}

/**
 * 장르 표를 돌려주되, 받지 못하면 빈 표로 넘어갑니다.
 *
 * 장르 이름은 응답을 읽기 좋게 만드는 부가 정보일 뿐이라, 여기서 실패했다고
 * 영화 조회 자체를 접을 이유는 없습니다. 반대로 장르 이름으로 걸러야 하는
 * 호출은 표가 반드시 필요하므로 `requireGenreMap()`을 씁니다.
 */
export async function fetchGenreMap(
  language: string,
  timeoutMs: number,
  auth?: TmdbAuth,
): Promise<Map<number, string>> {
  try {
    return await requireGenreMap(language, timeoutMs, auth);
  } catch {
    return new Map();
  }
}

/** 장르 표가 있어야 풀 수 있는 값인지 봅니다. 숫자 id는 표 없이도 그대로 씁니다. */
export function needsGenreTable(genre: string | undefined): boolean {
  const wanted = genre?.trim();
  return Boolean(wanted) && !/^\d+$/.test(wanted as string);
}

/**
 * 장르 이름이나 id를 TMDB 장르 id로 바꿉니다.
 *
 * @returns 장르 id 문자열. 장르를 지정하지 않았으면 `undefined`
 * @throws 지정한 장르를 표에서 찾지 못한 경우
 */
export function resolveGenreId(
  genre: string | undefined,
  genres: Map<number, string>,
): string | undefined {
  const wanted = genre?.trim();
  if (!wanted) return undefined;
  if (/^\d+$/.test(wanted)) return wanted;

  const normalized = wanted.toLowerCase();
  for (const [id, name] of genres) {
    if (name.toLowerCase() === normalized) return String(id);
  }

  const known = [...genres.values()].join(', ');
  throw new Error(`Unknown genre "${wanted}"${known ? ` — known genres: ${known}` : ''}`);
}

/** 장르 캐시를 비웁니다. 테스트에서 씁니다. */
export function clearGenreCache(): void {
  cache.clear();
}
