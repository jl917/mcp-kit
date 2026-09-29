# 4. 코드 작성 규칙

## 파일명 규칙

- **파일명**: `kebab-case` 사용 (예: `readme-docs-plugin.ts`, `case-convert.ts`)
- **인터페이스/타입 파일**: `kebab-case`로 통일
- **테스트 파일**: 대상 파일 옆에 `*.test.ts`로 배치 (예: `src/exchange/parse.test.ts`)
- **빌드 스크립트**: `scripts/` 하위에 위치 (`readme-docs-plugin.ts`)

## TypeScript 강타입 규칙

- **`any` 사용 금지**: `@typescript-eslint/no-explicit-any`가 소스 코드에 명시되어 있으나, `tool.ts`의 handler 타입에 한해 `any`가 허용됨 (MCP SDK 인터페이스 호환성 때문). 신규 코드에서는 `any` 사용을 지양하고 `unknown` + 타입 가드 사용
- **Zod 스키마**: 모든 도구의 입력 스키마는 `z.ZodRawShape`로 타입이 고정됨
- **제네릭 활용**: `toolDef<const TSchema extends z.ZodRawShape>()` 패턴으로 타입 안전한 스키마 정의
- **`const` 타입 매개변수**: Zod 스키마 정의 시 `const` 타입 매개변수를 사용하여 literal type 보존

## 도구(tool) 작성 패턴

모든 도구는 다음 구조를 따라야 합니다:

```typescript
import { defineTool, toolDef, text } from "@/common";
import { z } from "zod";

export const tools = {
  myTool: toolDef({
    name: "my_tool",                    // MCP에 노출되는 이름 (snake_case 권장)
    description: "설명",                 // 도구 설명 (한 문장)
    inputSchema: {
      param1: z.string().describe("파라미터 설명"),  // Zod 스키마 + describe
      // 모든 필드는 required입니다. 값을 비우는 뜻은 `null` 하나뿐입니다.
      param2: z.number().nullable().describe("선택적 파라미터. null이면 10"),
      param3: z.enum(["a", "b"]).describe("선택지"),
    },
    handler: async ({ param1, param2, param3 }) => {
      // `null`을 `undefined`로 바꿔 도메인 계층이 기본값을 적용하게 합니다.
      return text(`result: ${param1} ${param2 ?? undefined}`);
    },
  }),
};
```

- **`toolDef()`**: 타입 추론이 적용된 도우미 함수 (실제 동작은 단순 반환)
- **`defineTool()`**: `AnyToolDef` 타입으로 캐스팅 (server.ts에서 배열로 변환 시 사용)
- **`text()`**: `{ content: [{ type: "text", text: content }] }` 형태의 MCP ToolResult 생성 헬퍼

`AnyToolDef`에는 `examples`, `guidelines`, `typeLabels`, `typeDefs`, `returnType`,
`returnDescription` 필드도 남아 있습니다. 문서를 손으로 쓰게 되어 이제 아무도 읽지
않으므로 채우지 않습니다. `toolDef()` / `defineTool()` 시그니처가 변경 금지 대상이라
타입에만 남겨 둡니다 ([09-safe-change-rules](09-safe-change-rules.md) 참고).

## 입력 스키마 규칙 (OpenAI 도구 가이드)

도구 스키마는 OpenAI 호환 엔드포인트가 그대로 소비합니다(에이전트 키트가 MCP 도구를
`ChatOpenAI`에 연결합니다). 그래서
[OpenAI 함수 호출 가이드](https://developers.openai.com/api/docs/guides/function-calling)를
따릅니다. strict 모드는 지원하지 않는 키워드가 하나라도 남으면 요청 전체를 거절하므로,
`inputSchema`에서 아래를 쓰지 않습니다.

| 금지 | 만들어지는 키워드 | 대신 |
|------|-------------------|------|
| `.default(x)` | `default` | `.nullable()`, 기본값은 `.describe()`에 적음 |
| `.optional()` / `.nullish()` | 필드가 `required`에서 빠짐 | `.nullable()` |
| `.positive()` / `.min()` / `.max()` | `exclusiveMinimum`, `minimum`, `maximum` | 도메인 계층에서 범위로 끊고, 범위는 `.describe()`에 적음 |
| `.int()` | `minimum` / `maximum` (zod 4의 안전 정수 경계) | 그냥 `z.number()` |
| `.length()` / `.regex()` | `minLength`, `maxLength`, `pattern` | 핸들러나 도메인 계층에서 검사 |

따라오는 결과

- **모든 필드가 `required`입니다.** 가이드가 "All fields in `properties` must be marked
  as `required`"를 요구합니다. 호출 쪽은 필드를 생략할 수 없고 `null`을 넘깁니다.
- **`null`은 "기본값을 쓰라"는 뜻입니다.** 핸들러가 `null`을 `undefined`로 바꿔
  도메인 계층(`src/exchange/`·`src/tmdb/`·`src/system/`)이 기본값을 적용합니다.
- **기본값과 범위는 `.describe()`에 둡니다.** 모델이 읽을 수 있는 자리는 여기뿐이고,
  같은 내용을 `README.md`와 `SKILL.md`에 다시 적습니다.
- **`src/tools/openai-schema.test.ts`가 이 규칙을 강제합니다.** MCP SDK가 실제로
  내보내는 JSON Schema를 검사하므로, 이 테스트를 통과하지 못하는 도구는 추가하지 않습니다.

## 단일 파일 최대 길이 제한

- **도구 정의 파일**: 최대 200줄 권장 (도구가 많아지면 별도 파일로 분리)
- **핸들러 로직**: 가능한 한 도구 정의 파일 내에 인라인으로 작성. 공통 로직이 필요하면 별도 유틸리티 함수로 추출

## 문서

`README.md`와 `skills/<bin>/SKILL.md`는 손으로 씁니다. 생성기도 `pnpm readme` 명령도
없습니다. 도구를 추가·변경하면 두 파일을 손으로 고치며, 스키마에서 빠진 기본값과
범위도 여기에 함께 적습니다.

## import/export 규칙

- **Named exports** 사용 (default export 금지)
- **Path alias**:
  - `@/*` → `src/*`. 루트 `tsconfig.json`의 `paths`에 정의하며, 테스트는 `rstest.config.ts`가 같은 별칭을 미러링함
  - 공유 키트는 `@/common`, 에이전트 키트는 `@/common/agent`로 가져옴 (`@/common`은 `agent/`를 재노출하지 않음)
- **상대 경로 vs 별칭**: 다른 디렉토리를 참조하는 크로스 디렉토리 import는 `@/` 사용 (예: `server.ts` → `@/tools/index`). 동일 디렉토리 내 형제 모듈은 상대 경로 유지 (예: `./exchange`)
- **파일 확장자**: 생략 (`moduleResolution: "Bundler"` — tsc, tsup/esbuild, rstest 모두 `.ts` 파일을 해석). 전부 번들링되므로 런타임 확장자가 필요 없음
- **Re-export**: `export { tools } from "./exchange"` 형태로 필요한 것만 선별하여 re-export

## 주석 작성 규칙

- **도구 설명**: `description` 필드에 한글로 간결하게 작성
- **Zod describe**: 모든 파라미터에 `.describe()`를 붙입니다. 선택이 아니라 필수입니다 — `default`와 범위 키워드를 스키마에서 빼는 대신 `.describe()`가 모델이 그것을 읽는 유일한 자리입니다
- **코드 주석**: 필수적인 이유를 설명할 때만 사용 (특히 `eslint-disable` 주석에는 반드시 이유 명시)
- **사용 시 주의사항**: 도구 정의가 아니라 `README.md`와 `SKILL.md`에 적습니다

## 비동기 처리 방식

- 모든 도구 핸들러는 **`async` 함수**로 작성
- 에러는 핸들러 내부에서 `try/catch`로 처리하거나, CLI의 `handleCliError()`에서 Zod 에러를 자동 포맷팅
- MCP 서버의 경우 SDK가 내부적으로 비동기 에러를 처리

## 전역 예외 처리

- **CLI**: `handleCliError()`가 `ZodError`를 감지하여 사용자 친화적 메시지로 변환
- **MCP 서버**: `server.ts`에서 최상위 `catch`로 프로세스 종료 처리
- 도구 핸들러 내부에서 발생한 예외는 MCP SDK가 자동으로 `CallToolResult` 에러 응답으로 변환
