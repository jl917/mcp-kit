import { TMDB_BASE_URL } from './types';

/**
 * TMDB 인증 정보.
 *
 * v3는 두 가지 인증을 모두 받습니다. API 키는 쿼리 문자열로, 읽기 액세스 토큰은
 * `Authorization: Bearer` 헤더로 보냅니다. 둘 다 있으면 토큰을 씁니다 —
 * 비밀값이 URL에 남지 않고, 프록시·로그에 새지 않습니다.
 */
export interface TmdbAuth {
  apiKey?: string;
  accessToken?: string;
}

/** 인증 정보를 읽는 환경 변수. */
export const TMDB_ENV_KEYS = ['TMDB_API_KEY', 'TMDB_ACCESS_TOKEN'] as const;

/** 쿼리 문자열로 실어 보낼 값. `undefined`와 빈 문자열은 빠집니다. */
export type QueryParams = Record<string, string | number | boolean | undefined>;

/** 환경 변수에서 인증 정보를 읽습니다. 값이 비어 있으면 없는 것으로 봅니다. */
export function resolveAuth(env: NodeJS.ProcessEnv = process.env): TmdbAuth {
  return {
    apiKey: env.TMDB_API_KEY?.trim() || undefined,
    accessToken: env.TMDB_ACCESS_TOKEN?.trim() || undefined,
  };
}

/**
 * 요청 URL과 헤더를 만듭니다.
 *
 * @throws 인증 정보가 하나도 없는 경우
 */
export function buildRequest(
  path: string,
  params: QueryParams,
  auth: TmdbAuth,
): { url: string; headers: Record<string, string> } {
  if (!auth.accessToken && !auth.apiKey) {
    throw new Error(
      `TMDB credentials missing — set ${TMDB_ENV_KEYS[0]} (v3 API key) or ${TMDB_ENV_KEYS[1]} (read access token)`,
    );
  }

  const url = new URL(`${TMDB_BASE_URL}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') continue;
    url.searchParams.set(key, String(value));
  }

  const headers: Record<string, string> = { accept: 'application/json' };
  if (auth.accessToken) {
    headers.authorization = `Bearer ${auth.accessToken}`;
  } else if (auth.apiKey) {
    url.searchParams.set('api_key', auth.apiKey);
  }

  return { url: url.toString(), headers };
}

/**
 * TMDB에 GET 요청을 보내고 JSON 본문을 돌려줍니다.
 *
 * @throws 인증 정보가 없거나, 제한 시간을 넘겼거나, 응답이 2xx가 아닌 경우
 */
export async function tmdbGet<T>(
  path: string,
  params: QueryParams,
  timeoutMs: number,
  auth: TmdbAuth = resolveAuth(),
): Promise<T> {
  const { url, headers } = buildRequest(path, params, auth);

  let response: Response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs) });
  } catch (err) {
    throw new Error(`TMDB request failed for ${path}: ${(err as Error).message}`);
  }

  if (!response.ok) {
    throw new Error(
      `TMDB responded ${response.status} for ${path}: ${await readMessage(response)}`,
    );
  }

  return (await response.json()) as T;
}

/** 오류 응답에서 TMDB가 준 설명을 꺼냅니다. 읽지 못하면 상태 문구만 씁니다. */
async function readMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { status_message?: string };
    return body.status_message ?? response.statusText;
  } catch {
    return response.statusText;
  }
}
