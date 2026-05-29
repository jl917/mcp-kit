# 2. 전체 기술 스택

## 프레임워크 및 언어

| 항목 | 버전 | 설명 |
|------|------|------|
| Node.js | `>=24.10.0` (`.nvmrc` 기준) | 런타임 |
| TypeScript | `^5.6.3` | 언어 |
| pnpm | `9.12.1` | 패키지 매니저 |
| Turbo | `^2.3.3` | 모노레포 빌드 오케스트레이션 |

## 핵심 의존성

| 패키지 | 버전 | 용도 |
|--------|------|------|
| `@modelcontextprotocol/sdk` | `^1.29.0` | MCP 서버 구현 (Server, StdioServerTransport, CallToolResult 등) |
| `zod` | `^4.4.2` | 도구 입력 스키마 정의 및 런타임 검증 |

## 문서 사이트

| 도구 | 버전 | 용도 |
|------|------|------|
| **Rspress** (`@rspress/core`) | `^2.0.12` | 문서 사이트 프레임워크 (Vite/Rspack 기반) |
| **@rspress/plugin-llms** | `^2.0.12` | llms.txt / llms-full.txt 자동 생성 |
| **Netlify** | `netlify-cli ^26.0.2` | 문서 사이트 배포 |

`apps/site/scripts/package-docs-plugin.ts` — 패키지 README를 동적으로 문서 페이지로 변환하는 커스텀 Rspress 플러그인

## 빌드 및 번들링

| 도구 | 용도 |
|------|------|
| **tsup** (`^8.5.1`) | TypeScript → ESM 번들링, dts 생성, minify |
| **Turbo** (`^2.3.3`) | 모노레포 태스크 실행, 빌드 캐싱, 의존성 그래프 관리 |

번들링 설정 공통 사항 (`packages/common/build/tsup.config.mjs`):
- ESM 포맷 (`"format": ["esm"]`)
- `@modelcontextprotocol/sdk`, `zod`는 **external** (번들에 포함하지 않음)
- `@julong/*`, `@common`은 **noExternal** (내부 모듈이므로 번들에 포함)
- Minify 활성화 (`"minify": true`)
- 각 패키지는 3개의 엔트리 포인트: `index.ts`, `server.ts`, `cli.ts`

## CI/CD

| 도구 | 용도 |
|------|------|
| **GitHub Actions** | CI, Auto PR, Release 워크플로우 |
| **multi-semantic-release** | 모노레포용 semantic-release (패키지별 독립 버전 관리) |
| **semantic-release/commit-analyzer** | Conventional Commits 기반 버전 결정 |
| **semantic-release/changelog** | CHANGELOG.md 자동 생성 |
| **semantic-release/npm** | npm 자동 배포 |
| **semantic-release/git** | 버전 태그 생성 |
| **semantic-release/github** | GitHub Release 생성 |

## 릴리스 규칙 (`.releaserc.json`)

| 커밋 타입 | 버전 Bump |
|-----------|-----------|
| `feat` | minor (`1.x.0`) |
| `fix` | patch (`1.0.x`) |
| `perf` | patch (`1.0.x`) |
| `revert` | patch (`1.0.x`) |
| `BREAKING CHANGE` (footer) | major (`x.0.0`) |
| `docs`, `chore`, `refactor`, `test` | 릴리스 없음 |

## 부재 항목 (현재 미사용)

- **린터**: ESLint 설정 없음
- **포매터**: Prettier 설정 없음
- **테스트 프레임워크**: Vitest, Jest 등 테스트 도구 미설정
- **테스트 파일**: `*.test.ts` 파일 존재하지 않음
- **UI 프레임워크**: React, Next.js 등 미사용 (MCP 서버 전용)
- **데이터베이스**: 미사용
- **HTTP 서버**: 미사용 (MCP stdio 전송 방식만 사용)
