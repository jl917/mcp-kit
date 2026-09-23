import { tools as exchangeTools } from './exchange';
import { tools as movieTools } from './movie';

export { exchangeRatesTool, exchangeRateTool } from './exchange';
export { nowPlayingMoviesTool, upcomingMoviesTool, movieRecommendationsTool } from './movie';

/**
 * MCP 클라이언트 설정에 실어 줘야 하는 환경 변수.
 *
 * `scripts/update-readme.mjs`가 이 목록으로 README의 `env` 블록을 만듭니다.
 * TMDB는 읽기 액세스 토큰(`TMDB_ACCESS_TOKEN`)도 받지만, 복사해 쓰는 설정에는
 * 둘 중 하나만 있으면 되므로 v3 API 키만 싣습니다.
 */
export const UTILS_ENV_KEYS = ['TMDB_API_KEY'] as const;

export const tools = { ...exchangeTools, ...movieTools };
