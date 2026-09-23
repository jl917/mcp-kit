import { resolve } from 'node:path';

/**
 * 작업 디렉터리의 `.env`를 읽어 환경 변수에 채웁니다.
 *
 * 셸에 이미 있는 값이 우선합니다 (Node `loadEnvFile`의 규칙). 그래서
 * `TMDB_API_KEY=... pnpm start`처럼 한 번만 덮어써서 돌리는 방식이 그대로 통합니다.
 *
 * 파일이 없으면 아무 일도 하지 않습니다. npx로 받은 서버는 남의 디렉터리에서
 * 실행되므로 `.env`가 없는 쪽이 정상입니다. `loadEnvFile`이 없는 런타임
 * (Node 20.12 미만)에서도 같은 이유로 조용히 넘어갑니다.
 *
 * stdio MCP에서 stdout은 JSON-RPC 프레임 전용이므로 여기서는 아무것도 출력하지 않습니다.
 *
 * @param dir - `.env`를 찾을 디렉터리. 생략하면 현재 작업 디렉터리
 * @returns 파일을 실제로 읽었으면 `true`
 */
export function loadDotEnv(dir: string = process.cwd()): boolean {
  try {
    process.loadEnvFile(resolve(dir, '.env'));
    return true;
  } catch {
    return false;
  }
}

/**
 * 지정한 키 중 값이 있는 것만 추려 환경 변수 객체를 만듭니다.
 *
 * MCP stdio 클라이언트는 `env`를 주지 않으면 `HOME`·`PATH` 같은 소수의 변수만
 * 자식에게 물려줍니다. 그래서 서버가 읽어야 할 키는 여기서 골라 명시적으로
 * 넘겨야 하고, 값이 없는 키를 빈 문자열로 넘기면 "설정됐지만 빈 값"이 되어
 * 오류 메시지가 엉뚱해지므로 빠뜨립니다.
 */
export function pickEnv(
  keys: readonly string[],
  env: NodeJS.ProcessEnv = process.env,
): Record<string, string> {
  const picked: Record<string, string> = {};
  for (const key of keys) {
    const value = env[key]?.trim();
    if (value) picked[key] = value;
  }
  return picked;
}
