# 2. 전체 기술 스택

## 프레임워크 및 언어

| 항목 | 버전 | 설명 |
|------|------|------|
| Node.js | `>=24.10.0` (`.nvmrc` 기준) | 런타임 |
| TypeScript | `^5.6.3` | 언어 |
| pnpm | `9.12.1` | 패키지 매니저 |

## 핵심 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@modelcontextprotocol/sdk` | `^1.29.0` | MCP 서버 구현 (Server, StdioServerTransport, CallToolResult 등) |
| `zod` | `^4.4.2` | 도구 입력 스키마 정의 및 런타임 검증 |
| `playwright` | `^1.50.0` | 포털 페이지를 실제로 열어 환율을 읽는 스크레이핑 엔진 |

## 문서 사이트

| 도구 | 버전 | 용도 |
|------|------|------|
| **Rspress** (`@rspress/core`) | `^2.0.12` | 문서 사이트 프레임워크 (Vite/Rspack 기반) |
| **@rspress/plugin-llms** | `^2.0.12` | llms.txt / llms-full.txt 자동 생성 |
| **Netlify** | `netlify-cli ^26.0.2` | 문서 사이트 배포 |

`scripts/readme-docs-plugin.ts` — 생성된 루트 README를 `/api` 문서 페이지로 변환하는 커스텀 Rspress 플러그인

## 빌드 및 번들링

| 도구 | 용도 |
|------|------|
| **tsup** (`^8.5.1`) | TypeScript → ESM/CJS 번들링, dts 생성, minify |

번들링 설정 (`tsup.config.ts`):
- ESM + CJS 포맷 (`"format": ["esm", "cjs"]`)
- `playwright`를 제외한 **모든 의존성을 번들에 인라인** (`noExternal: [/^(?!playwright)/]`)
- `playwright`만 **external** — 런타임에 자기 패키지 디렉터리에서 브라우저 드라이버를 찾으므로 번들링 불가
- Minify 활성화 (`"minify": true`)
- 엔트리 포인트 3개: `src/index.ts`, `src/server.ts`, `src/cli.ts`
- 빌드 후처리: `server`/`cli` 번들에 shebang 추가, 빈 청크 제거, `dev`에서는 `skills/<bin>/SKILL.md`와 README 재생성

## 코드 품질 및 테스트

| 도구 | 버전 | 용도 |
|------|------|------|
| **Rslint** (`@rslint/core`) | `^0.5.3` | 린트 (`rslint.config.ts`) |
| **Prettier** | `^3.5.3` | 포매팅 (`.prettierrc`) |
| **Rstest** (`@rstest/core`) | `^0.10.3` | 테스트 러너 + v8 커버리지 (`rstest.config.ts`) |
| **Bun** | `^1.2.0` | `scripts/update-readme.mjs`가 TypeScript를 직접 import하기 위해 사용 |

## 에이전트 테스트 (선택)

`src/agent.test.ts`는 실제 LLM과 실제 포털을 호출합니다. 기본 `pnpm test`에서는 건너뛰고 `pnpm test:agent`로만 실행합니다.

| 패키지 | 용도 |
|--------|------|
| `@langchain/core`, `@langchain/openai`, `@langchain/mcp-adapters`, `langchain` | LLM·MCP 어댑터 |
| `deepagents` | 에이전트 루프 |

## CI/CD

| 도구 | 용도 |
|------|------|
| **GitHub Actions** | CI, Release 워크플로우 |
| **release-please** (`googleapis/release-please-action@v4`) | 릴리스 자동화 (릴리스 PR 기반 단일 패키지 버전 관리) |
| Conventional Commits | 버전 결정 기준 (`feat`/`fix`/`BREAKING CHANGE`) |
| release-please CHANGELOG | 루트 CHANGELOG.md 자동 생성 |
| `pnpm publish` | npm 배포 (릴리스 PR 머지 후 `publish` 잡에서 실행) |
| release-please 태그 | 버전 태그 생성 (`v<version>`) |
| release-please 릴리스 | GitHub Release 생성 |

## 릴리스 규칙 (`release-please-config.json` + `.release-please-manifest.json`)

버전 관리는 [Conventional Commits](https://www.conventionalcommits.org/)를 기준으로 동작합니다. `main`에 push될 때 즉시 릴리스하는 대신, release-please가 버전 Bump와 CHANGELOG 항목을 담은 **릴리스 PR**을 열거나 업데이트합니다. 이 PR을 머지하면 태그와 GitHub Release가 생성되고 npm 배포가 트리거됩니다. 현재 버전은 `.release-please-manifest.json`에서 추적됩니다.

`release-please-config.json` 주요 옵션: `release-type: "node"`, `include-component-in-tag: false`, `include-v-in-tag: true` (태그는 `v<version>` 형식, 예: `v1.0.0`), 그리고 저장소 루트 하나만 담는 `packages: { ".": {} }` 맵.

| 커밋 타입 | 버전 Bump |
|-----------|-----------|
| `feat` | minor (`1.x.0`) |
| `fix` | patch (`1.0.x`) |
| `perf` | patch (`1.0.x`) |
| `revert` | patch (`1.0.x`) |
| `BREAKING CHANGE` (footer) | major (`x.0.0`) |
| `docs`, `chore`, `refactor`, `test`, `build`, `ci`, `style` | 릴리스 없음 |

## 부재 항목 (현재 미사용)

- **모노레포 도구**: Turborepo·pnpm workspace 미사용 (단일 저장소·단일 패키지)
- **UI 프레임워크**: React, Next.js 등 미사용 (MCP 서버 전용)
- **데이터베이스**: 미사용
- **HTTP 서버**: 미사용 (MCP stdio 전송 방식만 사용)
