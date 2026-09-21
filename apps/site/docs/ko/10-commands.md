# 10. 프로젝트 전용 명령어

> 모든 명령어는 루트 디렉토리에서 실행합니다.
> `pnpm`은 `9.12.1` 버전을 사용합니다.

## 환경 설정

```bash
# Node.js 버전 설정 (.nvmrc 기준)
nvm use

# 의존성 설치
pnpm install

# 의존성 업데이트 (잠금 파일 기준)
pnpm install --frozen-lockfile   # CI 환경
```

## 로컬 개발

```bash
# 전체 빌드 (Turborepo가 의존성 그래프 분석 후 최적 순서로 빌드)
pnpm build

# 특정 패키지만 빌드
pnpm --filter @julong/mono-rele2-core build
pnpm --filter @julong/mono-rele2-utils build

# 개발 모드 (파일 변경 감시)
pnpm dev                          # turbo run dev

# 클린 빌드 (캐시 및 dist 제거)
pnpm clean

# 린트 (타입 검사 기반, 현재 ESLint 미설정)
pnpm lint                         # turbo run lint

# 포맷 (Prettier 미설정 — 예비)
pnpm format                       # turbo run format
```

## 타입 검사

```bash
# 전체 패키지 타입 검사
pnpm typecheck

# 특정 패키지만 타입 검사
pnpm --filter @julong/mono-rele2-core typecheck
pnpm --filter @julong/mono-rele2-utils typecheck
```

## 문서 생성

```bash
# 전체 패키지 README 업데이트 (bun 필요, build 불필요)
pnpm readme

# 특정 패키지만 README 업데이트
pnpm --filter @julong/mono-rele2-core readme
```

## 문서 사이트 (Rspress)

```bash
# 문서 사이트 로컬 개발 서버 실행
pnpm docs:dev                      # turbo run docs:dev

# 문서 사이트 정적 빌드 (doc_build/ 디렉토리 출력)
pnpm docs:build                    # turbo run docs:build
```

문서 사이트는 `apps/site/` 디렉토리에 위치하며, Rspress 프레임워크로 동작합니다. 정적 문서는 `apps/site/docs/`의 `.md` 파일로, 패키지 문서는 `packages/*/README.md`에서 자동 생성됩니다.

## 테스트

```bash
# 전체 테스트 실행 (현재 테스트 미설정)
pnpm test
```

> 참고: 현재 테스트 프레임워크가 설정되어 있지 않습니다. 테스트가 도입되면 이 명령어가 활성화됩니다.

## 검증 (CI와 동일한 순서)

```bash
# 1. 타입 검사
pnpm typecheck

# 2. 빌드
pnpm build
```

> 릴리스는 release-please가 처리합니다. 로컬 릴리스 드라이런 명령어는 없으며, 릴리스 PR을 머지하면 실제 릴리스가 트리거됩니다.

## MCP 서버 실행

```bash
# npx로 직접 실행 (npm 배포 버전)
npx @julong/mono-rele2-core
npx @julong/mono-rele2-utils
npx @julong/mono-rele2-exchange

# 로컬 빌드 실행 (개발 중)
node packages/core/dist/server.js
node packages/utils/dist/server.js
node packages/exchange/dist/server.js

# MCP Inspector로 디버깅
npx @modelcontextprotocol/inspector node packages/core/dist/server.js
npx @modelcontextprotocol/inspector node packages/utils/dist/server.js
npx @modelcontextprotocol/inspector node packages/exchange/dist/server.js

# MCP Client Config (env 변수 포함 예시)
# @julong/mono-rele2-utils는 API_KEY 환경 변수 전달 지원
# MCP client config.json:
# {
#   "mcpServers": {
#     "@julong/mono-rele2-utils": {
#       "command": "npx",
#       "args": ["-y", "@julong/mono-rele2-utils"],
#       "env": { "API_KEY": "<value>" }
#     }
#   }
# }
```

## CLI 도구 실행

```bash
# 도구 목록 보기
npx @julong/mono-rele2-core-cli
npx @julong/mono-rele2-utils-cli
npx @julong/mono-rele2-exchange-cli

# 특정 도구 실행 (core)
npx @julong/mono-rele2-core-cli echoTool "hello world"
npx @julong/mono-rele2-core-cli timestampTool unix
npx @julong/mono-rele2-core-cli envTool HOME
npx @julong/mono-rele2-core-cli uuidTool

# 특정 도구 실행 (utils)
npx @julong/mono-rele2-utils-cli cnTool '["btn","active"]'
npx @julong/mono-rele2-utils-cli caseConvertTool "hello world" camel
npx @julong/mono-rele2-utils-cli truncateTool "hello world" 8
npx @julong/mono-rele2-utils-cli objectFlattenTool '{"user":{"name":"Alice"}}'
npx @julong/mono-rele2-utils-cli getUserTool '{"name":{"first":"Alice","last":"Kim"},"location":{"city":"Seoul"}}'
npx @julong/mono-rele2-utils-cli envGetTool '["API_KEY"]'

# 특정 도구 실행 (exchange) — 최초 1회 `npx playwright install chromium` 필요
npx @julong/mono-rele2-exchange-cli exchangeRatesTool
npx @julong/mono-rele2-exchange-cli exchangeRatesTool '["naver","daum"]' '["CNY","JPY"]'
npx @julong/mono-rele2-exchange-cli exchangeRateTool google EUR

# 로컬 빌드로 CLI 실행
node packages/core/dist/cli.js echoTool "hello world"
node packages/utils/dist/cli.js cnTool '["btn","active"]'
node packages/exchange/dist/cli.js exchangeRateTool naver CNY
```

## 에이전트 통합 테스트 (MCP + LLM)

exchange MCP 서버를 LLM 에이전트(`deepagents` + `langchain`) 아래에서 띄워 도구 실행 결과까지
확인합니다. 실행 전 싸이클은 `packages/common/.log/<taskId>.log`에 기록됩니다.

```bash
# 1. 환경 변수 템플릿을 복사해 LLM 자격 증명을 채웁니다
cp .env.example .env

# 2. 에이전트가 띄울 MCP 서버 번들을 먼저 빌드합니다
pnpm --filter @julong/mono-rele2-exchange build

# 3. 에이전트를 검증으로 실행
pnpm test:agent

# 4. 전체 실행 로그 확인
less packages/common/.log/rstest-agent-all.log
```

`pnpm test:agent`는 `packages/exchange/src/agent.test.ts`를 실행합니다. MCP 서버가 두 도구를
노출하는지, LLM이 그중 하나를 실제로 호출했는지, 도구 인자가 요청 범위와 맞는지, 최종 답변의
숫자가 모델이 지어낸 것이 아니라 도구 결과에서 온 것인지를 검증합니다. 일반 `pnpm test`는
`RUN_AGENT_TESTS`가 없으면 이 파일을 건너뜁니다.

에이전트를 조립하는 곳은 이 테스트뿐입니다. 모델·로깅·`nodeMcpServer()`는 `@common/agent`가
제공하고, 테스트는 어떤 MCP 서버를 어떤 프롬프트로 부를지만 정합니다. 배포되는 패키지는
도구만 제공하며 langchain을 import하지 않습니다.

| 환경 변수 | 용도 |
|-----------|------|
| `SILICONFLOW_URL` | OpenAI 호환 base URL (예: `https://api.siliconflow.cn/v1`) |
| `SILICONFLOW_MODEL` | 모델명 (예: `Qwen/Qwen3-8B`) |
| `OPENAI_API_KEY` | API 키 — `SILICONFLOW_API_KEY` / `API_KEY`도 허용 |

> 네트워크, 유효한 API 키, Playwright 브라우저(`npx playwright install chromium`)가 필요합니다.
> `pnpm test`에는 포함되지 않습니다.

## Git 커밋

```bash
# feat: 새로운 기능 (minor 릴리스)
git commit -m "feat(scope): add new feature"

# fix: 버그 수정 (patch 릴리스)
git commit -m "fix(scope): resolve null reference"

# BREAKING CHANGE (major 릴리스)
git commit -m "feat(scope)!: rename public API
"
# 또는 footer에 BREAKING CHANGE 명시
git commit -m "feat(scope): rename public API

BREAKING CHANGE: oldName has been renamed to newName"

# 문서/설정 변경 (릴리스 없음)
git commit -m "docs: update README"
git commit -m "chore: update dependencies"
git commit -m "refactor(scope): restructure module"
```

## 패키지 배포

```bash
# main에 push — release-please가 버전 Bump + CHANGELOG가 담긴 릴리스 PR을 열거나 업데이트
git push origin main

# 릴리스 PR을 머지하면 실제 릴리스가 트리거됨:
# 태그 + GitHub Release가 생성되고, 이어서 publish 잡이 `pnpm -r publish`로 npm에 배포
```

## 번들 분석

```bash
# 빌드된 번들 내용 확인
ls packages/core/dist/
ls packages/utils/dist/

# 생성된 스킬 문서 확인
ls packages/core/dist/skills/
ls packages/utils/dist/skills/

# 문서 사이트 빌드 결과 확인
ls apps/site/doc_build/
```

## 문제 해결

```bash
# Turbo 캐시 초기화
rm -rf .turbo
pnpm build --force

# pnpm 저장소 문제
pnpm store prune
rm -rf node_modules
pnpm install

# 전체 클린
pnpm clean && rm -rf node_modules .turbo && pnpm install && pnpm build
```
