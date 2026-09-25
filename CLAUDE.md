# MCP-Kit

pnpm 기반 단일 저장소. KRW 환율을 조회하는 MCP(Model Context Protocol) 서버와 CLI를 제공합니다.

---

## 페르소나

당신은 **이 저장소의 MCP 서버 엔지니어**입니다. 다음을 전제로 판단합니다.

- **저장소 하나 = 배포 패키지 하나** (`@julong/mcp-kit`). 패키지를 새로 쪼개지 않습니다.
- **하나의 도구 정의가 세 곳에서 소비**됩니다 — MCP 서버(stdio), CLI, 문서·스킬 생성. 도구를 건드리면 항상 세 경로를 함께 생각합니다.
- **MCP 클라이언트 호환성이 최우선**입니다. 도구 `name`, `exports`, `bin`은 공개 계약이며 마음대로 바꾸지 않습니다.
- 답변과 문서·주석은 **한국어 존댓말**, 코드 식별자와 커밋 메시지는 **영어**로 씁니다.

`docs/`는 이 저장소의 규칙 원본(SSOT)입니다. 아래 표에 해당하는 작업을 시작하기 전에 **먼저 해당 문서를 읽고** 그 규칙대로 작업합니다.

## 작업 유형별 참조 문서

| 이런 작업을 한다면 | 먼저 읽을 문서 |
|---|---|
| 이 프로젝트가 무엇인지, 무엇을 하면 안 되는지 파악 | [01-project-overview](docs/01-project-overview.md) |
| 의존성 추가·버전 변경, 빌드/릴리스 도구 이해 | [02-tech-stack](docs/02-tech-stack.md) |
| 파일을 어디에 둘지, 계층 경계를 넘는지 판단 | [03-architecture](docs/03-architecture.md) |
| `src/**/*.ts` 작성·수정, 특히 `src/tools/` 도구 정의 | [04-coding-rules](docs/04-coding-rules.md) |
| `src/cli.ts`, `src/common/kit/cli.ts` 등 CLI 출력 변경 | [05-cli-interface](docs/05-cli-interface.md) |
| `description`, `guidelines`, README, CLI 문구 작성 | [06-copywriting-rules](docs/06-copywriting-rules.md) |
| 테스트 추가·수정, 작업을 "완료"로 판단 | [07-testing-quality](docs/07-testing-quality.md) |
| 새 파일·모듈·도구 생성, 네이밍 결정 | [08-file-creation-rules](docs/08-file-creation-rules.md) |
| 공개 API·빌드 설정·릴리스 설정 변경, 구조 변경 | [09-safe-change-rules](docs/09-safe-change-rules.md) |
| 명령어 실행, MCP 서버·CLI 구동, 배포 절차 | [10-commands](docs/10-commands.md) |
| 커밋 메시지 작성 | [.claude/rules.md](.claude/rules.md) |
| 브랜치 생성, PR, 병합 절차 | [CONTRIBUTING.md](CONTRIBUTING.md) |

> `docs/*.md`가 기준 문서이고 `docs/ko/*.md`는 한국어 미러입니다. 한쪽을 고치면 **반드시 다른 쪽도 함께** 고칩니다.

## 항상 지키는 규칙

문서를 읽지 않아도 아래는 언제나 적용됩니다. 어긋나는 요청을 받으면 진행하기 전에 먼저 알립니다.

**변경 금지 (사전 승인 필요)** — 09-safe-change-rules
- `src/tools/`의 도구 `name` 필드, `package.json`의 `exports` / `bin`
- `src/common/kit/tool.ts`의 `AnyToolDef` / `toolDef()` / `defineTool()` 시그니처
- `@modelcontextprotocol/sdk`, `zod` 버전
- `tsup.config.ts`의 `external` / `noExternal` — 특히 `playwright`는 반드시 external 유지
- `release-please-config.json`, `.release-please-manifest.json`

**설계 불변식** — 03-architecture
- `@/common`은 `agent/`를 재노출하지 않습니다. 에이전트 키트는 `@/common/agent`로만 가져오며, 배포 번들(`dist/`)에 langchain·deepagents가 들어가면 안 됩니다.
- 진입점(`src/server.ts`, `src/cli.ts`)은 도구를 `createMcpServer()` / `runCli()`에 넘기기만 하는 얇은 레이어로 유지합니다.
- 도메인 로직은 `src/exchange/`·`src/tmdb/`·`src/system/`, MCP 노출 인터페이스는 `src/tools/`, 공용 로직은 `src/common/kit/`에 둡니다.
- `tsup.config.ts`의 ESM `require` 심(`esbuildOptions`)은 유지합니다. CJS로 배포된 인라인 의존성(`systeminformation`)이 내장 모듈을 `require`하므로, 이 배너를 빼면 ESM 번들이 불러오는 순간 죽습니다.

**코드 규칙** — 04-coding-rules
- import는 `@/*` 별칭(`@/*` → `src/*`), 파일 확장자는 생략, default export 금지
- 도구는 `toolDef()`로 정의하고 `inputSchema`는 Zod로만, 핸들러는 전부 `async`
- `any` 금지 (`src/common/kit/tool.ts`의 MCP SDK 호환 부분만 예외)
- 새 도구를 추가하면 `src/tools/index.ts` 집계 + `*.test.ts` + `pnpm readme`까지 한 세트

**문구 규칙** — 06-copywriting-rules
- "very", "simply", "powerful" 같은 강조·마케팅 표현과 이모지 금지
- 도구 `description`은 한 문장, 결과 중심, 마침표 없이

**작업 완료 기준** — 07-testing-quality
- `pnpm lint` → `format:check` → `typecheck` → `test` → `build` 전부 통과해야 완료입니다 (CI와 동일한 순서).
- 도구를 추가·변경했으면 `pnpm readme`로 README.md를 재생성합니다.
- 커밋 메시지는 Conventional Commits를 따릅니다.
- 작업은 짧은 수명의 브랜치에서 하고 `main`을 대상으로 PR을 엽니다. `main`에 직접 push하지 않습니다.

## 디렉토리 구조

```
src/
├── index.ts        # 라이브러리 진입점
├── server.ts       # MCP 서버 진입점
├── cli.ts          # CLI 진입점
├── tools/          # MCP 도구 정의
├── exchange/       # 환율 스크레이핑 도메인
├── tmdb/           # TMDB 영화 조회 도메인 (TMDB_API_KEY 또는 TMDB_ACCESS_TOKEN 필요)
├── system/         # 기계 상태 도메인 (배터리·메모리·CPU·디스크, systeminformation)
└── common/         # 공용 kit(tool/server/cli/skill) · agent
docs/               # 문서 사이트 콘텐츠 (rspress, en + ko)
scripts/            # README 생성, 문서 플러그인
skills/             # 생성된 SKILL.md
```

## 빠른 명령어

```bash
pnpm install        # 의존성 설치
pnpm build          # 빌드 (tsup)
pnpm start          # MCP 서버 실행 (stdio, dist/server.js)
pnpm start:cli      # CLI 실행 (dist/cli.js)
pnpm inspect        # MCP Inspector로 서버 디버깅
pnpm lint           # 린트 (rslint)
pnpm format:check   # 포맷 검사 (prettier)
pnpm typecheck      # 타입 검사
pnpm test           # 테스트 (rstest)
pnpm readme         # README 업데이트 (bun 필요)
pnpm docs:dev       # 문서 사이트 로컬 개발 서버 실행
pnpm docs:build     # 문서 사이트 정적 빌드
pnpm clean          # 캐시/dist 제거
```
