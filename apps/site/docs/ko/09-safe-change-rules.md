# 9. 안전한 변경 규칙

## 핵심 아키텍처 보호

### 변경 금지 (사전 승인 필요)

| 대상 | 이유 |
|------|------|
| `packages/common/kit/tool.ts`의 `AnyToolDef`, `toolDef()`, `defineTool()` 시그니처 | 모든 패키지의 도구 정의가 의존하는 핵심 인터페이스 |
| `@modelcontextprotocol/sdk` 버전 | MCP 프로토콜 호환성에 직접 영향 |
| `zod` 버전 | 모든 도구의 스키마 정의가 의존 |
| `tsup.config.mjs`의 `external`/`noExternal` 설정 | 번들링 결과에 직접 영향 |
| `release-please-config.json` / `.release-please-manifest.json` | 버전 관리 정책 및 추적되는 패키지 버전에 직접 영향 |
| `packages/*/src/tools/`의 도구 `name` 필드 | MCP 프로토콜에 노출되는 도구 식별자로, 변경 시 클라이언트 호환성 깨짐 |

### 신중한 변경 필요 (영향도 확인 필수)

| 대상 | 주의사항 |
|------|----------|
| `packages/common/kit/`의 함수 시그니처 변경 | 모든 패키지에서 사용 중이므로 일괄 수정 필요 |
| `packages/*/package.json`의 `exports` 필드 | 패키지 소비자의 import 경로에 영향 |
| `packages/common/build/update-readme.mjs`의 템플릿 | 모든 패키지의 README 포맷에 일괄 적용 |
| turbo.json의 `tasks` 설정 | 빌드/테스트 파이프라인 순서에 영향 |

## 공용 API 경로 변경 금지

각 패키지가 npm에 배포되므로, `exports` 필드를 통해 노출하는 공개 API 경로를 함부로 변경하면 안 됩니다:

```json
{
  "exports": {
    ".": {                    // 변경 금지: import("@julong/mono-rele2-core")
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "bin": {
    "mono-rele2-core": "./dist/server.js",       // 변경 금지: npx @julong/mono-rele2-core
    "mono-rele2-core-cli": "./dist/cli.js"       // 변경 금지: npx @julong/mono-rele2-core-cli
  }
}
```

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

- 신규 패키지 추가 (모노레포 구조 변경)
- `packages/common/kit/`의 핵심 인터페이스 재설계
- 빌드 시스템 변경 (tsup → 다른 번들러)
- CI/CD 파이프라인 재구성
- Conventional Commits 정책 변경
- Node.js/TypeScript 메이저 버전 업그레이드

## 릴리스 브랜치 보호

- `develop` 브랜치: CI 통과 필수 (타입 검사 + 빌드)
- `main` 브랜치: `develop`에서 Auto PR로만 병합 가능 (직접 push 금지)
- `main`에 push되면 release-please가 버전 Bump + CHANGELOG가 담긴 **릴리스 PR**을 열거나 업데이트하며, 실제 태그/GitHub Release/npm 배포는 그 릴리스 PR을 머지할 때만 수행됨
- `[skip ci]`를 커밋 메시지에 포함하면 CI를 건너뛸 수 있음 (릴리스 커밋 등)
