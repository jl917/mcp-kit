# 5. UI 및 디자인 시스템

> 본 프로젝트는 **MCP 서버 키트**로, UI/UX 컴포넌트나 시각적 인터페이스를 포함하지 않습니다.
> 모든 상호작용은 CLI(터미널) 또는 MCP 프로토콜을 통한 AI-기반 인터페이스로 이루어집니다.

## CLI 출력 규칙

CLI는 `runCli()`를 통해 다음과 같은 형식으로 출력됩니다:

- **도구 목록 출력** (인자 없이 실행 시):
  ```
  Available skills:

    echoTool
    Returns the message as-is
      message    Message to echo
  ```
  - 도구명은 2칸 들여쓰기
  - 설명은 도구명 다음 줄
  - 파라미터는 4칸 들여쓰기 + 파라미터명 + 설명

- **도구 실행 결과**: `console.log()`로 일반 텍스트 출력
- **에러 메시지**: `console.error()`로 stderr에 출력

## CLI UX 규칙

- 도구 실행 결과는 **순수 텍스트**로만 반환 (색상, 포매팅, 이모지 사용 금지)
- 에러 메시지는 사람이 읽을 수 있는 자연어로 출력 (스택 트레이스 금지)
- `handleCliError()`는 ZodError를 파싱하여 `"fieldName: error message"` 형식으로 출력
- MCP 서버 모드에서는 모든 출력이 `CallToolResult.content` 배열의 `text` 항목으로 전달됨

## 접근성

- CLI는 시각적 요소에 의존하지 않음 (순수 텍스트 기반)
- MCP 프로토콜은 AI 어시스턴트가 결과를 자연어로 가공하여 전달하므로 별도 접근성 처리 불필요

## 컴포넌트 재사용 주의사항

- **`packages/common/kit/`의 함수는 모든 패키지에서 재사용**됨. 변경 시 모든 패키지에 영향이 가므로 주의
- **동일한 도구 정의가 `update-readme.mjs`와 `src/tools/*.ts`에 중복되지 않도록** 관리 — bun이 TS 소스를 직접 import하므로 중복 파일 생성 금지
- 빌드 설정(`tsup.config.mjs`)은 모든 패키지가 공유하므로, 변경 전 반드시 다른 패키지에 미치는 영향 확인
- 문서 생성 헬퍼(`skill.ts`의 `generateReadmeApiDocs()`)는 `typeLabels`, `typeDefs`, `returnType`, `returnDescription` 필드를 사용하여 풍부한 API 문서를 생성함. 도구 정의 시 이 필드들을 함께 작성할 것
