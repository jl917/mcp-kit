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
| `systeminformation` | `^5.33.13` | 실행 중인 기계의 배터리·메모리·CPU 부하·파일 시스템 용량을 읽는 수집기 |

> **새 패키지를 `package.json`의 어디에 넣는가.** 여기 적힌 것 중 `playwright`를 뺀 전부는
> 번들에 인라인되므로 빌드할 때만 필요합니다 — `devDependencies`에 넣습니다. `dependencies`는
> `tsup.config.ts`에서 `external`로 남아 배포된 번들과 함께 설치되어야 하는 패키지 자리이고,
> 해당하는 것은 `playwright` 하나뿐입니다. 번들되는 패키지를 `dependencies`에 넣어도 동작은
> 하지만, 설치하는 쪽이 한 번도 불러오지 않는 사본을 함께 받게 됩니다.

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
- 코드 분할 (`"splitting": true`)과 `"treeshake": true` — CJS 변환을 rollup이 맡습니다
- `playwright`를 제외한 **모든 의존성을 번들에 인라인** (`noExternal: [/^(?!playwright)/]`)
- `playwright`만 **external** — 런타임에 자기 패키지 디렉터리에서 브라우저 드라이버를 찾으므로 번들링 불가
- ESM 출력에는 `require` 심이 배너로 들어갑니다 (`esbuildOptions`) — 아래 참고
- Minify 활성화 (`"minify": true`)
- `define`으로 `package.json`의 `version`(`src/common/constants.ts`가 읽어 MCP `initialize` 응답에 실림)과 빌드 환경의 TMDB 자격 증명을 심습니다 (아래 참고)
- 엔트리 포인트 3개: `src/index.ts`, `src/server.ts`, `src/cli.ts`
- 빌드 후처리: `server`/`cli` 번들에 shebang 추가, 빈 청크 제거, `dev`에서는 `skills/<bin>/SKILL.md`와 README 재생성

### `treeshake: true`를 뺄 수 없는 이유

이 옵션이 없으면 tsup은 이미 minify된 esbuild 출력에 sucrase를 한 번 더 돌려 CJS로 바꿉니다.
minify가 만들어 내는 `return(await x)?.y ?? z` 형태를 sucrase가 `returnawait _asyncNullishCoalesce(...)`로
공백 없이 붙여 놓아서, `dist/*.cjs` 전체가 파싱되지 않습니다. `treeshake: true`를 켜면 CJS 코드 분할을
rollup이 맡고 sucrase 단계는 아예 돌지 않습니다. CI의 `Smoke test the built bundles` 단계가 빌드 결과를
직접 로드하므로 같은 문제가 조용히 배포되지 않습니다.

### ESM 출력에 `require` 심이 필요한 이유

`noExternal`이 모든 의존성을 인라인하는데, 그중 일부는 CommonJS로 배포됩니다 —
`systeminformation`은 자기 모듈 안에서 `require('os')`, `require('child_process')`를 부릅니다.
esbuild는 이 호출을 "런타임에 `require`가 있으면 쓰고 없으면 던진다"는 형태로 남기고, ESM에는
`require`가 없어서 도구를 하나도 부르기 전에 `Dynamic require of "os" is not supported`로 죽습니다.
`esbuildOptions`가 **ESM 형식에만** 배너를 붙여 `node:module`로 `require`를 만들어 둡니다.

```js
import { createRequire as __createRequire } from 'node:module';
const require = __createRequire(import.meta.url);
```

CJS 출력에는 이미 진짜 `require`가 있고 하나 더 선언하면 충돌하므로, 배너는 `context.format`을
보고 갈립니다. 내장 모듈을 `external`로 돌리는 방법은 통하지 않습니다 —
`noExternal: [/^(?!playwright)/]`는 `os` 같은 맨 이름까지 잡고 `external`보다 우선합니다.

### 빌드 시점 TMDB 자격 증명

`tsup.config.ts`는 빌드 환경(그리고 로컬 `.env`)의 `TMDB_API_KEY` / `TMDB_ACCESS_TOKEN`을 읽어
`src/tmdb/embedded.ts`의 `__TMDB_API_KEY__` / `__TMDB_ACCESS_TOKEN__` / `__TMDB_SEAL_SECRET__` 식별자를
문자열 리터럴로 바꿉니다. 자격 증명을 심어 만든 빌드는 띄울 때 값을 주지 않아도 영화 도구가 돌고, 심지
않은 빌드는 예전과 똑같이 호출 시점에 환경 변수를 읽습니다. 어떤 변수를 심었는지는 빌드 로그에 찍힙니다.

값은 빌드마다 새로 만든 열쇠로 AES-256-GCM으로 봉해서 넣습니다. 봉하는 쪽과 여는 쪽이 어긋나지 않도록
형식은 `src/tmdb/embedded.ts` 한 곳에만 둡니다. **이것은 암호화가 아니라 난독화입니다** — 열쇠가 같은
번들 안에 들어 있어 번들을 가진 사람은 언제든 열 수 있습니다. 얻는 것은 딱 두 가지입니다.

- 키가 `dist/`에 그대로 적힌 문자열로 남지 않아 자동 시크릿 스캐너나 눈으로 훑는 검사에 걸리지 않음
- 번들 일부를 이슈나 로그에 붙여 넣어도 자격 증명이 새지 않음

자격 증명을 배포해도 되는 것으로 만들어 주지는 않습니다.

`.github/workflows/release.yml`의 `Build` 단계는 저장소 시크릿을 넘깁니다. 즉 **npm에 올라가는
패키지에는 TMDB 자격 증명이 들어 있고**, `npx @julong/mcp-kit`는 클라이언트 설정에 아무것도 넣지 않아도
바로 돕니다. 설치한 사람은 누구나 그 키를 되찾을 수 있으므로, 뒤에 놓는 시크릿은 공개를 전제로 발급한
전용 키여야 합니다 — 개인 키나 다른 곳과 함께 쓰는 키를 넣지 않습니다. 남용되면 TMDB에서 새로 발급해
저장소 시크릿만 갈아 끼우면 다음 릴리스부터 반영됩니다. `Verify the credential made it into the bundle`
단계가 시크릿이 빠진 경우 릴리스를 실패시키므로, 자격 증명 없는 패키지가 실수로 올라가지는 않습니다.

`ci.yml`도 같은 시크릿을 넘겨 심는 경로를 매번 함께 돌리지만 검사는 하지 않습니다 — 포크에서 올라온
PR에는 시크릿이 내려오지 않아 심지 않은 빌드가 나오는 것이 정상이기 때문입니다.

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
