# 8. 파일 및 컴포넌트 생성 규칙

## 신규 파일 생성 위치

| 생성할 것 | 위치 | 예시 |
|----------|------|------|
| 새 MCP 서버 패키지 | `packages/<name>/` | `packages/date/` |
| 기존 패키지에 새 도구 | `packages/<name>/src/tools/<name>.ts` | `packages/core/src/tools/network.ts` |
| 도구 그룹 re-export | `packages/<name>/src/tools/index.ts` | 기존 파일에 export 추가 |
| 공유 키트 기능 | `packages/common/kit/<name>.ts` | `packages/common/kit/validator.ts` |
| 공유 키트 re-export | `packages/common/kit/index.ts` | 기존 파일에 export 추가 |
| 공유 타입 | `packages/common/types.ts` | 기존 파일에 타입 추가 |
| 공유 상수 | `packages/common/constants.ts` | 기존 파일에 상수 추가 |

## 패키지 신규 생성 시 필요한 파일

새 패키지를 추가할 때는 다음 파일들이 **모두 필요**합니다:

1. `package.json` — name, version, description, exports, bin, scripts, dependencies 포함
2. `tsconfig.json` — `@common` path alias, `NodeNext` module, `noEmit: true`
3. `tsup.config.ts` — `createTsupConfig()` 호출
4. `src/index.ts` — `export { tools } from "./tools/index.js"` + `export { generateSkillMarkdown, generateReadmeSkills } from "@common"`
5. `src/server.ts` — MCP 서버 생성 및 시작
6. `src/cli.ts` — CLI 실행
7. `src/tools/index.ts` — tools re-export
8. `src/tools/<name>.ts` — 실제 도구 정의

### ./common-update.md (release 파이프라인 관련)

`packages/core/common-update.md`와 `packages/utils/common-update.md`는 release 워크플로우가 자동 관리하는 파일입니다. 직접 수정하지 마세요. `packages/common/`이 변경될 때만 자동 업데이트됩니다.

## 기존 컴포넌트 수정 여부 판단 기준

| 상황 | 행동 |
|------|------|
| 새 도구 추가 | `src/tools/`에 새 파일 생성 OR 기존 파일에 도구 추가 (도메인이 같은 경우) |
| 기존 도구 로직 수정 | 해당 도구의 핸들러만 수정 (파일 분할 불필요) |
| 공통 동작 변경 | `packages/common/kit/` 수정 + 모든 패키지 재빌드 |
| CLI 출력 포맷 변경 | `packages/common/kit/cli.ts`의 `formatSkills()` 수정 |
| README 포맷 변경 | `packages/common/build/update-readme.mjs` 수정 |

## 공통 로직 추출 시점

다음 조건 중 **하나라도** 해당되면 공통 로직으로 추출:

1. 동일한 코드가 2개 이상의 패키지에서 사용됨 → `packages/common/kit/`으로 이동
2. 동일한 코드가 1개 패키지 내 2개 이상의 도구에서 사용됨 → 패키지 내 유틸리티 함수로 추출 (예: `cn.ts`)
3. 복잡한 Zod 스키마가 재사용됨 → 공유 Zod 스키마로 분리

## 공통 네이밍 규칙

| 항목 | 규칙 | 예시 |
|------|------|------|
| 패키지명 | `@julong/<description>` | `@julong/mono-rele2-core` |
| CLI 바이너리명 | `<package-name>-cli` | `mono-rele2-core-cli` |
| 도구명 (변수) | `camelCase` + `Tool` 접미사 | `echoTool`, `timestampTool` |
| 도구명 (MCP 노출) | `snake_case` | `echo`, `case_convert` |
| 파일명 | `kebab-case` | `update-readme.mjs`, `case-convert.ts` |
| 인터페이스 | `PascalCase` | `ToolDefShape`, `AnyToolDef` |
| 타입 (utility) | `PascalCase` | `Nullable<T>`, `Optional<T>` |
| 비동기 함수 | `async function` | 모든 도구 핸들러 |
| 상수 | `UPPER_SNAKE_CASE` | `VERSION` |
