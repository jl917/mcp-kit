# 8. 파일 및 컴포넌트 생성 규칙

## 신규 파일 생성 위치

| 생성할 것 | 위치 | 예시 |
|----------|------|------|
| 새 도구 | `src/tools/<name>.ts` | `src/tools/exchange.ts` |
| 도구 그룹 re-export | `src/tools/index.ts` | 기존 파일에 export 추가 |
| 새 도메인 모듈 | `src/<domain>/` | `src/exchange/` |
| 새 스크레이퍼 | `src/exchange/providers/<name>.ts` | `src/exchange/providers/daum.ts` |
| 공유 키트 기능 | `src/common/kit/<name>.ts` | `src/common/kit/validator.ts` |
| 공유 키트 re-export | `src/common/kit/index.ts` | 기존 파일에 export 추가 |
| 공유 타입 | `src/common/types.ts` | 기존 파일에 타입 추가 |
| 공유 상수 | `src/common/constants.ts` | 기존 파일에 상수 추가 |
| 빌드/생성 스크립트 | `scripts/<name>.mjs\|.ts` | `scripts/update-readme.mjs` |
| 테스트 | 대상 파일 옆 `<name>.test.ts` | `src/exchange/parse.test.ts` |

## 새 도구 추가 시 체크리스트

1. `src/tools/<name>.ts` — `toolDef()`로 도구 정의 (description, inputSchema, handler, examples, guidelines)
2. `src/tools/index.ts` — 새 도구를 `tools` 객체에 병합
3. `src/tools/<name>.test.ts` — 핸들러 단위 테스트
4. `pnpm build && pnpm readme` — README.md 재생성
5. 도구가 노출하는 이름(`name` 필드)은 MCP 클라이언트 호환성에 직결되므로 신중히 결정

## 기존 컴포넌트 수정 여부 판단 기준

| 상황 | 행동 |
|------|------|
| 새 도구 추가 | `src/tools/`에 새 파일 생성 OR 기존 파일에 도구 추가 (도메인이 같은 경우) |
| 기존 도구 로직 수정 | 해당 도구의 핸들러만 수정 (파일 분할 불필요) |
| 공통 동작 변경 | `src/common/kit/` 수정 + 서버·CLI·문서 생성 세 경로 확인 |
| CLI 출력 포맷 변경 | `src/common/kit/cli.ts` 수정 |
| README 포맷 변경 | `scripts/update-readme.mjs` 수정 |
| SKILL.md 포맷 변경 | `src/common/kit/skill.ts`의 `generateSkillMarkdown()` 수정 |

## 공통 로직 추출 시점

다음 조건 중 **하나라도** 해당되면 공통 로직으로 추출:

1. 동일한 코드를 MCP 서버·CLI·문서 생성 중 2곳 이상이 사용함 → `src/common/kit/`으로 이동
2. 동일한 코드가 2개 이상의 도구에서 사용됨 → 해당 도메인 디렉터리의 유틸리티로 추출 (예: `src/exchange/parse.ts`)
3. 복잡한 Zod 스키마가 재사용됨 → 공유 Zod 스키마로 분리

## 공통 네이밍 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 패키지명 | `@julong/<name>` | `@julong/mcp-kit` |
| MCP 서버 바이너리명 | `<name>` | `mcp-kit` |
| CLI 바이너리명 | `<name>-cli` | `mcp-kit-cli` |
| 도구명 (변수) | `camelCase` + `Tool` 접미사 | `exchangeRateTool`, `exchangeRatesTool` |
| 도구명 (MCP 노출) | `snake_case` | `exchange_rate`, `exchange_rates` |
| 파일명 | `kebab-case` | `update-readme.mjs`, `case-convert.ts` |
| 인터페이스 | `PascalCase` | `ToolDefShape`, `AnyToolDef` |
| 타입 (utility) | `PascalCase` | `Nullable<T>`, `Optional<T>` |
| 비동기 함수 | `async function` | 모든 도구 핸들러 |
| 상수 | `UPPER_SNAKE_CASE` | `VERSION` |
