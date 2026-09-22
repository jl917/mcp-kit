# 10. 프로젝트 전용 명령어

> 모든 명령어는 루트 디렉토리에서 실행합니다.
> `pnpm`은 `9.12.1` 버전을 사용합니다.

## 환경 설정

```bash
# Node.js 버전 설정 (.nvmrc 기준)
nvm use

# 의존성 설치
pnpm install

# 의존성 설치 (잠금 파일 기준)
pnpm install --frozen-lockfile   # CI 환경
```

## 로컬 개발

```bash
# 빌드 (tsup — index / server / cli 3개 엔트리)
pnpm build

# 개발 모드 (파일 변경 감시 + SKILL.md·README 재생성)
pnpm dev

# 클린 (dist, coverage, doc_build, node_modules 제거)
pnpm clean

# 린트
pnpm lint

# 포맷
pnpm format
pnpm format:check
```

## 타입 검사

```bash
pnpm typecheck        # tsc --noEmit
```

## 문서 생성

```bash
# README.md 재생성 (bun 필요, build 불필요 — TS 소스를 직접 import)
pnpm readme
```

## 문서 사이트 (Rspress)

```bash
# 문서 사이트 로컬 개발 서버 실행
pnpm docs:dev

# 문서 사이트 정적 빌드 (doc_build/ 디렉토리 출력)
pnpm docs:build
```

문서 사이트는 루트 `rspress.config.ts`로 동작합니다. 정적 문서는 `docs/`의 `.md` 파일이고, 도구 API 문서(`/api`)는 `readme-docs-plugin`이 루트 `README.md`에서 자동 생성합니다.

## 테스트

```bash
# 전체 테스트 (agent 테스트는 자동으로 건너뜀)
pnpm test

# 에이전트 테스트만 실행 (LLM + 네트워크 필요)
pnpm test:agent
```

커버리지 리포트는 `coverage/` 에 생성됩니다.

## 검증 (CI와 동일한 순서)

```bash
# 1. 린트
pnpm lint

# 2. 포맷 검사
pnpm format:check

# 3. 타입 검사
pnpm typecheck

# 4. 테스트
pnpm test

# 5. 빌드
pnpm build
```

> 릴리스는 release-please가 처리합니다. 로컬 릴리스 드라이런 명령어는 없으며, 릴리스 PR을 머지하면 실제 릴리스가 트리거됩니다.

## MCP 서버 실행

```bash
# npx로 직접 실행 (npm 배포 버전)
npx @julong/mcp-kit

# 로컬 빌드 실행 (개발 중)
node dist/server.js

# MCP Inspector로 디버깅
npx @modelcontextprotocol/inspector node dist/server.js

# MCP Client Config
# {
#   "mcpServers": {
#     "@julong/mcp-kit": {
#       "command": "npx",
#       "args": ["-y", "@julong/mcp-kit"]
#     }
#   }
# }
```

`WHITE_FN` / `BLACK_FN` 환경 변수로 노출할 도구를 제한할 수 있습니다 (도구 `name` 기준, 쉼표 구분). `WHITE_FN`이 비어 있지 않으면 allowlist로 동작합니다.

## CLI 도구 실행

```bash
# 도구 목록 보기
npx mcp-kit-cli

# 특정 도구 실행 — 최초 1회 `npx playwright install chromium` 필요
npx mcp-kit-cli exchangeRatesTool
npx mcp-kit-cli exchangeRatesTool '["naver","daum"]' '["CNY","JPY"]'
npx mcp-kit-cli exchangeRateTool google EUR

# 로컬 빌드로 CLI 실행
node dist/cli.js exchangeRateTool naver CNY
```

## 에이전트 통합 테스트 (MCP + LLM)

MCP 서버를 LLM 에이전트(`deepagents` + `langchain`) 아래에서 띄워 도구 실행 결과까지
확인합니다. 실행 전 싸이클은 `src/common/.log/<taskId>.log`에 기록됩니다.

```bash
# 1. 환경 변수 템플릿을 복사해 LLM 자격 증명을 채웁니다
cp .env.example .env

# 2. 에이전트가 띄울 MCP 서버 번들을 먼저 빌드합니다
pnpm build

# 3. 에이전트를 검증으로 실행
pnpm test:agent

# 4. 전체 실행 로그 확인
less src/common/.log/rstest-agent-all.log
```

`pnpm test:agent`는 `src/agent.test.ts`를 실행합니다. MCP 서버가 두 도구를
노출하는지, LLM이 그중 하나를 실제로 호출했는지, 도구 인자가 요청 범위와 맞는지, 최종 답변의
숫자가 모델이 지어낸 것이 아니라 도구 결과에서 온 것인지를 검증합니다. 일반 `pnpm test`는
`RUN_AGENT_TESTS`가 없으면 이 파일을 건너뜁니다.

에이전트를 조립하는 곳은 이 테스트뿐입니다. 모델·로깅·`nodeMcpServer()`는 `@/common/agent`가
제공하고, 테스트는 어떤 MCP 서버를 어떤 프롬프트로 부를지만 정합니다. 배포되는 번들은
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
# 1. 작업 브랜치를 push하고 main을 대상으로 PR을 엽니다
git push -u origin <branch>
gh pr create --base main

# 2. PR에서 CI가 돌고, 통과하면 병합합니다

# 3. 병합되면 release-please가 버전 Bump + CHANGELOG를 담은
#    릴리스 PR을 열거나 업데이트합니다

# 4. 그 릴리스 PR을 머지하면 실제 릴리스가 수행됩니다:
#    태그(v<version>) + GitHub Release가 생성되고,
#    이어서 publish 잡이 `pnpm publish`로 npm에 배포
```

## 번들 분석

```bash
# 빌드된 번들 내용 확인
ls dist/

# 생성된 스킬 문서 확인
ls skills/

# 문서 사이트 빌드 결과 확인
ls doc_build/
```

## 문제 해결

```bash
# pnpm 저장소 문제
pnpm store prune
rm -rf node_modules
pnpm install

# 전체 클린
pnpm clean && pnpm install && pnpm build

# Playwright 브라우저 미설치로 환율 조회가 실패할 때
npx playwright install chromium
```

### `MCP error -32000: Connection closed`

클라이언트와 서버를 잇는 stdio 파이프가 끊겼다는 뜻입니다. 즉 서버 프로세스가 종료됐습니다. 서버는 모든 로그를 stderr로 남기므로, 해당 서버의 MCP 로그를 먼저 확인합니다.

| stderr에 남은 줄 | 의미 |
|---|---|
| 아무것도 없음 | 프로세스가 아예 뜨지 않았습니다. 클라이언트가 쓰는 `PATH`에 `npx`가 있는지, Node가 20 이상인지 확인합니다. |
| `[mcp-kit] ready on stdio (v…, node …)`가 없음 | 기동 실패입니다. 바로 뒤의 `[mcp-kit] server error:` 줄에 원인이 있습니다. |
| `[mcp-kit] uncaughtException:` / `unhandledRejection:` | 도구 핸들러 밖으로 에러가 샜습니다. 서버는 살아서 계속 응답하며, 그 줄이 원인을 가리킵니다. |
| `[mcp-kit] stdin closed by client — shutting down` | 정상 종료입니다. 클라이언트가 파이프를 닫았습니다. |
| `[mcp-kit] no tools registered` | `WHITE_FN` / `BLACK_FN`이 도구를 전부 걸러냈습니다. |

클라이언트 문제인지 서버 문제인지 가르려면 핸드셰이크를 밖에서 재현합니다.

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  | npx -y @julong/mcp-kit
```

기본 인자로 `exchange_rates`를 한 번 부르면 `timeoutMs × (통화 수 + 1)`, 통화 넷이면 최대 100초까지 걸립니다. 클라이언트의 도구 호출 제한 시간이 그보다 짧다면 `providers` / `currencies`를 좁히거나 `timeoutMs`를 낮춥니다.
