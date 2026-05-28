# 4. 코드 작성 규칙

## 파일명 규칙

- **파일명**: `kebab-case` 사용 (예: `update-readme.mjs`, `case-convert.ts`)
- **인터페이스/타입 파일**: `kebab-case`로 통일
- **테스트 파일**: 현재 테스트 미작성 상태 (추후 `*.test.ts` 컨벤션 사용 예정)
- **빌드 설정 파일**: `packages/common/build/` 하위에 위치하며 `.mjs` 확장자 사용

## TypeScript 강타입 규칙

- **`any` 사용 금지**: `@typescript-eslint/no-explicit-any`가 소스 코드에 명시되어 있으나, `tool.ts`의 handler 타입에 한해 `any`가 허용됨 (MCP SDK 인터페이스 호환성 때문). 신규 코드에서는 `any` 사용을 지양하고 `unknown` + 타입 가드 사용
- **Zod 스키마**: 모든 도구의 입력 스키마는 `z.ZodRawShape`로 타입이 고정됨
- **제네릭 활용**: `toolDef<const TSchema extends z.ZodRawShape>()` 패턴으로 타입 안전한 스키마 정의
- **`const` 타입 매개변수**: Zod 스키마 정의 시 `const` 타입 매개변수를 사용하여 literal type 보존

## 도구(tool) 작성 패턴

모든 도구는 다음 구조를 따라야 합니다:

```typescript
import { defineTool, toolDef, text } from "@common";
import { z } from "zod";

export const tools = {
  myTool: toolDef({
    name: "my_tool",                    // MCP에 노출되는 이름 (snake_case 권장)
    description: "설명",                 // 도구 설명 (한 문장)
    inputSchema: {
      param1: z.string().describe("파라미터 설명"),  // Zod 스키마 + describe
      param2: z.number().optional().describe("선택적 파라미터"),
      param3: z.enum(["a", "b"]).default("a").describe("선택지"),
    },
    handler: async ({ param1, param2, param3 }) => {
      // 비동기 핸들러
      return text(`result: ${param1}`);
    },
    examples: [                          // README/Skill 문서에 표시될 예제
      { args: ['"hello"'], result: "result: hello" },
    ],
    guidelines: [                        // CLI/Skill 문서에 표시될 가이드라인
      "이 도구는 ~할 때 사용합니다",
    ],
    typeLabels: {                        // (선택) README/API 문서의 타입 레이블 오버라이드
      param1: "MyCustomType",
    },
    typeDefs: {                          // (선택) 복잡한 타입의 TypeScript 정의
      param1: "type MyCustomType = string | number",
    },
    returnType: "string",                // (선택) 반환 타입 (API 문서용)
    returnDescription: "변환된 결과 문자열",  // (선택) 반환값 설명 (API 문서용)
  }),
};
```

- **`toolDef()`**: 타입 추론이 적용된 도우미 함수 (실제 동작은 단순 반환)
- **`defineTool()`**: `AnyToolDef` 타입으로 캐스팅 (server.ts에서 배열로 변환 시 사용)
- **`text()`**: `{ content: [{ type: "text", text: content }] }` 형태의 MCP ToolResult 생성 헬퍼

## 단일 파일 최대 길이 제한

- **도구 정의 파일**: 최대 200줄 권장 (도구가 많아지면 별도 파일로 분리)
- **핸들러 로직**: 가능한 한 도구 정의 파일 내에 인라인으로 작성. 공통 로직이 필요하면 별도 유틸리티 함수로 추출

## 문서 생성 헬퍼

`packages/common/kit/skill.ts`는 README와 Skill 문서를 생성하는 3가지 헬퍼를 제공합니다:

| 함수 | 용도 |
|------|------|
| `generateSkillMarkdown()` | tsup의 `onSuccess`에서 호출, `dist/skills/<binName>/skill.md` 생성 |
| `generateReadmeSkills()` | README에 간략한 도구 목록 표시 (더 이상 사용되지 않음) |
| `generateReadmeApiDocs()` | README에 TypeDoc/API 문서 스타일의 상세 도구 문서 생성 (현재 사용) |

`update-readme.mjs`는 `generateReadmeApiDocs()`를 사용하여 각 도구의 시그니처, 파라미터, 반환 타입, 타입 정의, CLI 사용법, 예제를 포함한 API 문서를 README.md에 생성합니다.

## import/export 규칙

- **Named exports** 사용 (default export 금지)
- **Path alias**: `@common` 사용 (`../common/index.ts`로 매핑). 패키지 외부의 `common/` 모듈 참조 시에만 사용
- **상대 경로**: 동일 패키지 내 모듈 참조는 상대 경로 사용 (예: `./tools/system.js`)
- **파일 확장자**: `.js` 확장자로 import (TypeScript의 NodeNext moduleResolution 규칙, tsc가 실제 `.ts` 파일을 찾음)
- **Re-export**: `export { tools } from "./tools/system.js"` 형태로 필요한 것만 선별하여 re-export

## 주석 작성 규칙

- **도구 설명**: `description` 필드에 한글로 간결하게 작성 (README/Skill 문서에 그대로 렌더링됨)
- **Zod describe**: 각 파라미터에 `.describe()`로 설명 추가 (README 테이블에 표시됨)
- **코드 주석**: 필수적인 이유를 설명할 때만 사용 (특히 `eslint-disable` 주석에는 반드시 이유 명시)
- **가이드라인**: `guidelines` 배열에 도구 사용 시 주의사항을 문자열로 추가

## 비동기 처리 방식

- 모든 도구 핸들러는 **`async` 함수**로 작성
- 에러는 핸들러 내부에서 `try/catch`로 처리하거나, CLI의 `handleCliError()`에서 Zod 에러를 자동 포맷팅
- MCP 서버의 경우 SDK가 내부적으로 비동기 에러를 처리

## 전역 예외 처리

- **CLI**: `handleCliError()`가 `ZodError`를 감지하여 사용자 친화적 메시지로 변환
- **MCP 서버**: `server.ts`에서 최상위 `catch`로 프로세스 종료 처리
- 도구 핸들러 내부에서 발생한 예외는 MCP SDK가 자동으로 `CallToolResult` 에러 응답으로 변환
