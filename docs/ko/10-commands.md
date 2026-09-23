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

# 로컬 빌드 실행 — 같은 동작을 스크립트로
pnpm build && pnpm start

# 로컬 빌드에서 도구 하나만 실행
pnpm start:cli nowPlayingMoviesTool

# MCP Inspector로 디버깅
pnpm inspect

# MCP Client Config
# {
#   "mcpServers": {
#     "@julong/mcp-kit": {
#       "command": "npx",
#       "args": ["-y", "@julong/mcp-kit"],
#       "env": { "TMDB_API_KEY": "<발급받은-키>" }
#     }
#   }
# }
```

`pnpm start`는 stdio 서버라 `stdin`을 기다리며 스스로는 아무것도 출력하지 않습니다. 정상 상태이고,
원래 MCP 클라이언트가 몰아 주는 쪽입니다. 손으로 응답을 보려면 JSON-RPC 프레임을 파이프로 넣습니다.

```bash
printf '%s\n%s\n%s\n' \
  '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"probe","version":"1"}}}' \
  '{"jsonrpc":"2.0","method":"notifications/initialized"}' \
  '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
  | pnpm -s start
```

`WHITE_FN` / `BLACK_FN` 환경 변수로 노출할 도구를 제한할 수 있습니다 (도구 `name` 기준, 쉼표 구분). `WHITE_FN`이 비어 있지 않으면 allowlist로 동작합니다.

### 자격 증명을 읽는 순서

서버와 CLI는 `TMDB_API_KEY` / `TMDB_ACCESS_TOKEN`을 프로세스 환경 변수에서 읽습니다. 우선순위는
다음과 같습니다.

1. 이미 환경에 설정된 값 — MCP 클라이언트 설정의 `env` 블록이나 `TMDB_API_KEY=... pnpm start`처럼
   앞에 붙여 준 값
2. 현재 작업 디렉터리의 `.env` 파일 (시작할 때 한 번 읽습니다)
3. 빌드 시점에 번들에 심긴 자격 증명 (아래 참고)

환경에 이미 있는 값이 언제나 `.env`보다 우선하고, 둘 중 무엇이든 번들에 심긴 값보다 우선합니다.
환경 변수는 통째로 봅니다 — `TMDB_API_KEY`든 `TMDB_ACCESS_TOKEN`이든 하나라도 값을 주는 순간 심긴
값은 나머지 한쪽을 채우지 않고 전부 무시됩니다. 토큰이 키보다 먼저 선택되므로, 두 출처를 섞으면
직접 넘긴 키가 조용히 버려지기 때문입니다. 어느 쪽에도 없으면 영화 도구는 두 변수 이름을 알려 주는
`Error: ...` 한 줄로 답합니다.

### 자격 증명을 심은 빌드 만들기

`pnpm build`는 빌드 환경의 `TMDB_API_KEY` / `TMDB_ACCESS_TOKEN`을 읽어 번들에 그 값을 적어 둡니다.
그렇게 만든 서버는 자격 증명 없이 띄워도 그대로 돕니다.

```bash
# 저장소 루트의 .env에서 읽어 심기
pnpm build

# 이번 빌드에만 심기
TMDB_API_KEY=<your-key> pnpm build

# 이제 환경 변수 없이도 영화 도구가 돕니다
node dist/cli.js nowPlayingMoviesTool
```

무엇을 심었는지는 빌드 로그에 찍힙니다.

```
TMDB credentials embedded in the bundle (sealed, not secret): TMDB_API_KEY
TMDB credentials not embedded — the bundle reads the environment at run time
```

값은 평문이 아니라 AES-256-GCM으로 봉해서 넣으므로 `dist/`에서 문자열로 검색되지 않습니다. 다만 여는
열쇠가 같은 번들에 함께 들어가므로 이것은 암호화가 아니라 난독화입니다 — 번들을 가진 사람은 키를
되찾을 수 있습니다. 이렇게 만든 빌드는 비밀값을 들고 있는 것으로 다루십시오 — 커밋하지 않고, 릴리스에
첨부하지 않고, `npm publish` 하지 않습니다. 값을 바꾸거나 빼려면 변수를 비운 채 다시 빌드합니다.

CI에서는 같은 두 변수를 저장소 시크릿에서 받아 `.github/workflows/ci.yml`의 `Test` 단계에 넘깁니다.

```yaml
- name: Test
  run: pnpm test
  env:
    TMDB_API_KEY: ${{ secrets.TMDB_API_KEY }}
    TMDB_ACCESS_TOKEN: ${{ secrets.TMDB_ACCESS_TOKEN }}
```

시크릿은 Settings → Secrets and variables → Actions에서 등록합니다. 값이 있으면 `pnpm test`가
TMDB를 실제로 호출하는 테스트까지 함께 돌고, 없으면 그 테스트만 건너뛴 채 나머지는 그대로
통과합니다. 포크에서 올라온 PR에는 시크릿이 내려오지 않으므로 항상 건너뛰는 쪽으로 갑니다.
자격 증명이 있어도 끄고 싶으면 `SKIP_TMDB_LIVE_TESTS=1`을 씁니다.

두 워크플로의 `Build` 단계에는 자격 증명을 일부러 넘기지 않습니다. 빌드에 넘긴 키는 번들에 그대로
적히고, 그 번들이 `pnpm publish`로 올라가는 바로 그 결과물이라 설치하는 모든 사람이 그 키를 갖게 됩니다.

> MCP 클라이언트는 작업 디렉터리를 마음대로 정해 서버를 띄우므로, `.env`는 직접 서버를 실행할 때만
> 믿을 수 있습니다. 클라이언트 설정에서는 `env` 블록을 쓰십시오.

### LM Studio에서 연결하기

LM Studio도 같은 `mcpServers` 형식을 읽습니다 (Program → Install → `mcp.json` 편집). 빌드된 진입점을
절대 경로로 가리키고 자격 증명은 `env`로 넘깁니다.

```json
{
  "mcpServers": {
    "mcp-kit": {
      "command": "node",
      "args": ["/absolute/path/to/mcp-kit/dist/server.js"],
      "env": { "TMDB_API_KEY": "<발급받은-키>" }
    }
  }
}
```

먼저 `pnpm build`를 돌립니다. 위 경로는 소스가 아니라 빌드 결과물입니다.

## CLI 도구 실행

```bash
# 도구 목록 보기
npx mcp-kit-cli

# 환율 도구 실행 — 최초 1회 `npx playwright install chromium` 필요
npx mcp-kit-cli exchangeRatesTool
npx mcp-kit-cli exchangeRatesTool '["naver","daum"]' '["CNY","JPY"]'
npx mcp-kit-cli exchangeRateTool google EUR

# 로컬 빌드로 CLI 실행
node dist/cli.js exchangeRateTool naver CNY
```

## 영화 도구 실행

TMDB 도구에는 자격 증명이 필요합니다 — `TMDB_API_KEY`(v3 API 키) 또는 `TMDB_ACCESS_TOKEN`(읽기 액세스
토큰) 중 하나입니다. <https://www.themoviedb.org/settings/api> 에서 발급합니다. 아래 예시는 환경 변수로
넘기는 방식이고, 자격 증명을 심어 만든 빌드(위 "자격 증명을 심은 빌드 만들기" 참고)라면 앞에 붙이지
않고 그대로 실행합니다. 브라우저를 쓰지 않으므로 Playwright는 필요 없습니다.

```bash
# 한 번 빌드한 뒤 로컬 CLI로 실행
pnpm build

# 상영 중 / 개봉 예정 (기본값: language=ko-KR, region=KR)
TMDB_API_KEY=<발급받은-키> node dist/cli.js nowPlayingMoviesTool
TMDB_API_KEY=<발급받은-키> node dist/cli.js upcomingMoviesTool

# 한국 개봉 기준이 아닌 목록
TMDB_API_KEY=<발급받은-키> node dist/cli.js nowPlayingMoviesTool en-US US

# 기준 영화 기반 추천 (인자 순서: title, movieId, genre, ...)
TMDB_API_KEY=<발급받은-키> node dist/cli.js movieRecommendationsTool 인터스텔라
TMDB_API_KEY=<발급받은-키> node dist/cli.js movieRecommendationsTool null 157336

# 기준 영화 없이 추천 — 이미 개봉한 작품을 인기순으로
TMDB_API_KEY=<발급받은-키> node dist/cli.js movieRecommendationsTool null null 액션
```

CLI는 인자를 스키마 필드 순서대로 채우므로, 앞 인자를 건너뛰려면 `null`을 넘깁니다.
자격 증명이 없으면 영화 도구는 예외 대신 `Error: ...` 한 줄로 답합니다.

```bash
# MCP 서버 자체를 stdio로 띄워 확인
TMDB_API_KEY=<발급받은-키> npx @modelcontextprotocol/inspector node dist/server.js
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
| `[mcp-kit] <도구> start`만 있고 짝이 되는 `done in …ms`가 없음 | 호출 도중에 프로세스가 죽었습니다. 서버가 마지막으로 하던 일이므로 그 호출부터 재현합니다. |
| `[mcp-kit] stdin closed by client — shutting down` | 정상 종료입니다. 클라이언트가 파이프를 닫았습니다. |
| `[mcp-kit] no tools registered` | `WHITE_FN` / `BLACK_FN`이 도구를 전부 걸러냈습니다. |

클라이언트 문제인지 서버 문제인지 가르려면 핸드셰이크를 밖에서 재현합니다.

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"t","version":"1"}}}' \
  | npx -y @julong/mcp-kit
```

`exchange_rates` 한 번의 예산은 `min(timeoutMs × (통화 수 + 1), 45초)`이고, 예산이 끝나면 그때까지 읽은 값을 그대로 돌려줍니다. 시간 안에 닿지 못한 통화는 `null`입니다. 45초 상한은 의도한 값입니다. MCP 클라이언트는 요청 하나를 기본 60초까지만 기다리고, 그 시간을 넘긴 호출은 부분 결과조차 남기지 못합니다. 통화를 더해도 그 선을 넘지 않도록 여기서 끊습니다.
