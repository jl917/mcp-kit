# 9. 안전한 변경 규칙

## 핵심 아키텍처 보호

### 변경 금지 (사전 승인 필요)

| 대상 | 이유 |
|------|------|
| `src/common/kit/tool.ts`의 `AnyToolDef`, `toolDef()`, `defineTool()` 시그니처 | 모든 도구 정의가 의존하는 핵심 인터페이스 |
| `@modelcontextprotocol/sdk` 버전 | MCP 프로토콜 호환성에 직접 영향 |
| `zod` 버전 | 모든 도구의 스키마 정의가 의존 |
| `tsup.config.ts`의 `external`/`noExternal` 설정 | 번들링 결과에 직접 영향 (특히 `playwright`는 반드시 external 유지) |
| `tsup.config.ts`의 `treeshake: true` | 빼면 CJS 변환이 다시 sucrase를 거치면서 `returnawait`를 뱉어 `dist/*.cjs` 전체가 파싱되지 않음 |
| `release-please-config.json` / `.release-please-manifest.json` | 버전 관리 정책 및 추적되는 버전에 직접 영향 |
| `src/tools/`의 도구 `name` 필드 | MCP 프로토콜에 노출되는 도구 식별자로, 변경 시 클라이언트 호환성 깨짐 |

### 신중한 변경 필요 (영향도 확인 필수)

| 대상 | 주의사항 |
|------|----------|
| `src/common/kit/`의 함수 시그니처 변경 | MCP 서버·CLI·문서 생성이 모두 사용하므로 일괄 수정 필요 |
| `package.json`의 `exports` / `bin` 필드 | 패키지 소비자의 import 경로와 `npx` 실행 이름에 영향 |
| `scripts/update-readme.mjs`의 템플릿 | README 포맷 전체에 적용 |
| `tsconfig.json`의 `paths` | `@/*` 별칭을 쓰는 모든 import에 영향 (`rstest.config.ts`도 함께 수정) |

## 공용 API 경로 변경 금지

이 저장소는 npm에 배포되므로, `exports` 필드를 통해 노출하는 공개 API 경로를 함부로 변경하면 안 됩니다:

```json
{
  "exports": {
    ".": {                    // 변경 금지: import("@julong/mcp-kit")
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "bin": {
    "mcp-kit": "./dist/server.js",       // 변경 금지: npx @julong/mcp-kit
    "mcp-kit-cli": "./dist/cli.js"       // 변경 금지: npx mcp-kit-cli
  }
}
```

> `bin` 이름을 바꾸면 `skills/<bin>/SKILL.md` 경로와 생성되는 README의 CLI 사용법도 함께 바뀝니다.

## 데이터베이스 스키마 무단 변경

본 프로젝트는 데이터베이스를 사용하지 않습니다. (별도 데이터 저장소 없음)

## 인증/권한 시스템

본 프로젝트는 자체 인증/권한 시스템을 포함하지 않습니다. MCP 서버 인증은 클라이언트(Claude Desktop, Cursor 등)의 환경변수 설정으로 위임됩니다.

## 버전 호환성 유지 규칙

1. **minor 버전**에서 도구 추가는 자유롭게 가능 (`feat` 커밋)
2. **기존 도구의 이름 변경은 금지** — 새 도구를 추가하고 이전 도구는 deprecated 메시지를 출력
3. **기존 도구의 inputSchema 필드 제거는 금지** — 필드는 추가만 가능 (optional로 추가)
4. **기존 도구 handler의 반환 타입 변경은 금지** — `ToolResult` (`{ content: [...] }`)를 유지
5. **major 버전 변경** 시에만 호환되지 않는 변경 허용

## 대규모 구조 변경 시 사전 승인 필요

다음 변경은 실행 전 반드시 팀 리뷰 또는 승인이 필요합니다:

- 저장소 구조 변경 (`src/` 레이아웃 재편, 패키지 분리 등)
- `src/common/kit/`의 핵심 인터페이스 재설계
- 빌드 시스템 변경 (tsup → 다른 번들러)
- CI/CD 파이프라인 재구성
- Conventional Commits 정책 변경
- Node.js/TypeScript 메이저 버전 업그레이드

## 릴리스 브랜치 보호

- 장수 브랜치는 `main` 하나입니다. 작업은 짧은 수명의 브랜치에서 하고 Pull Request로 `main`에 병합합니다 (직접 push 금지).
- CI(lint + format + 타입 검사 + 테스트 + 빌드)는 `main`을 대상으로 하는 모든 PR에서 실행되며, 통과해야 병합할 수 있습니다.
- `main`에 병합되면 release-please가 버전 Bump + CHANGELOG가 담긴 **릴리스 PR**을 열거나 업데이트하며, 실제 태그/GitHub Release/npm 배포는 그 릴리스 PR을 머지할 때만 수행됨
- `[skip ci]`를 커밋 메시지에 포함하면 push로 트리거되는 CI 실행을 건너뛸 수 있음 (릴리스 커밋 등)
