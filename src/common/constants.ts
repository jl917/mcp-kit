/**
 * MCP `initialize` 응답에 실려 나가는 서버 버전.
 *
 * `pnpm build`가 `package.json`의 `version`을 읽어 `__PKG_VERSION__` 자리에 박아
 * 넣습니다 (`tsup.config.ts`의 `define`). 손으로 맞추던 상수였을 때는 release-please가
 * `package.json`만 올리고 이 파일은 건드리지 않아 릴리스마다 조용히 벌어졌고,
 * 배포된 서버가 실제와 다른 버전을 보고했습니다.
 *
 * 번들러를 거치지 않고 소스를 그대로 실행하는 경우(rstest 등)에는 식별자가 선언되지
 * 않으므로 `typeof`로 확인한 뒤 읽고, 그때는 빌드가 아니라는 뜻의 `0.0.0-dev`가 됩니다.
 */

declare const __PKG_VERSION__: string;

export const VERSION: string =
  typeof __PKG_VERSION__ === 'string' && __PKG_VERSION__ ? __PKG_VERSION__ : '0.0.0-dev';
