# 7. 테스트 및 품질 기준

## 현재 상태

테스트 러너는 **Rstest**(`@rstest/core`)이며, 설정은 루트 `rstest.config.ts` 하나입니다. 테스트 파일은 대상 파일 옆에 `*.test.ts`로 둡니다.

```
src/exchange/parse.test.ts      # 파싱·단위 역산 단위 테스트
src/tools/exchange.test.ts      # 도구 핸들러 테스트
src/system/normalize.test.ts    # 기계 상태 정리·기본 디스크 선택 단위 테스트
src/system/collect.test.ts      # 항목 선택·동시 읽기·제한 시간 (systeminformation 모킹)
src/tools/system.test.ts        # 실제 기계를 읽는 도구 핸들러 테스트
src/common/kit/server.test.ts   # 도구 등록 필터·프로세스 가드·stderr 전용 로그 테스트
src/common/agent/log.test.ts    # 로그 직렬화·마스킹 테스트
src/agent.test.ts               # 실제 LLM + 실제 포털 (기본 실행에서 제외)
```

커버리지는 v8 provider로 항상 수집되며 `coverage/`에 text·html·lcov로 출력됩니다.

## 테스트 실행

```bash
pnpm test            # src/**/*.test.ts 전체 (agent 테스트는 describe.skipIf로 건너뜀)
pnpm test:agent      # RUN_AGENT_TESTS=1 로 agent.test.ts만 실행
```

`pnpm test:agent`는 사전 조건이 있습니다:

1. `pnpm build` — 에이전트가 띄울 `dist/server.js`가 필요
2. `npx playwright install chromium` — 최초 1회
3. 저장소 루트 `.env`에 `OPENAI_API_KEY`(또는 `SILICONFLOW_API_KEY`, `API_KEY`)

## 반드시 테스트해야 하는 핵심 시나리오

| 우선순위 | 대상 | 테스트 내용 |
|----------|------|------------|
| 🔴 상 | 각 도구 핸들러 | 정상 입력, 경계값, 에러 입력에 대한 응답 |
| 🔴 상 | Zod 스키마 검증 | Optional, Default, Enum 등 각 Zod 타입별 동작 확인 |
| 🔴 상 | 환율 파싱 | 고시 단위(100엔 등) 역산, 쉼표·공백 처리, 읽지 못한 값의 `null` 처리 |
| 🟡 중 | MCP 서버 등록 | `createMcpServer()`가 모든 도구를 올바르게 등록하는지 |
| 🟡 중 | CLI 파싱 | `runCli()`의 인자 파싱(JSON 자동 파싱 포함) |
| 🟢 하 | 문서 생성 | `generateReadmeApiDocs()` 출력 포맷 |

## 신규 코드 작성 시 테스트 규칙

1. **새 도구를 추가할 때마다** 해당 도구의 핸들러 단위 테스트를 함께 작성
2. **파라미터 Zod 스키마**가 추가/변경될 때 검증 테스트 추가
3. **예제(examples)** 가 실제로 동작하는지 확인
4. 네트워크·브라우저가 필요한 테스트는 `describe.skipIf`로 기본 실행에서 제외

## 품질 검증 방식

### 린트

```bash
pnpm lint            # rslint --config rslint.config.ts src scripts
```

- `@rslint/core`의 ts / js / import / unicorn recommended 구성 사용
- `@typescript-eslint/no-explicit-any`는 off (MCP SDK 인터페이스 호환성)

### 포매팅

```bash
pnpm format          # prettier --write
pnpm format:check    # CI에서 실행
```

### 타입 검사

```bash
pnpm typecheck       # tsc --noEmit
```

- 루트 `tsconfig.json`에 `"noEmit": true`, `strict: true`
- `include: ["src"]` — 소스와 테스트 파일이 모두 검사 대상

### 빌드 검증

```bash
pnpm build           # tsup
```

- tsup이 3개 엔트리(index, server, cli)를 모두 정상 번들링하는지 확인
- DTS 생성이 정상 동작하는지 확인
- 릴리스는 release-please(릴리스 PR 머지)가 처리하므로 CI에 릴리스 드라이런 단계가 없음

### CI 파이프라인 (`.github/workflows/ci.yml`)

`main`을 대상으로 하는 모든 PR과 `main` push에서 실행됩니다.

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm format:check`
4. `pnpm typecheck`
5. `pnpm test`
6. `pnpm build`

## "작업 완료" 판단 기준

변경 사항이 "완료"되려면 다음을 모두 충족해야 합니다:

- [ ] `pnpm lint` 통과
- [ ] `pnpm format:check` 통과
- [ ] `pnpm typecheck` 통과
- [ ] `pnpm test` 통과
- [ ] `pnpm build` 정상 완료
- [ ] 새 도구를 추가한 경우 `pnpm readme`로 README.md 업데이트
- [ ] 도구·의존성·빌드 설정을 건드렸거나, 문서가 정해 주지 않은 선택을 했거나, 답을 받지 못한 질문에 가정을 세웠으면 `.claude/decisions/`에 결정 기록 작성 — 형식은 [.claude/decision-log.md](https://github.com/jl917/mcp-kit/blob/main/.claude/decision-log.md)
- [ ] Conventional Commits 형식의 커밋 메시지 작성
- [ ] 불필요한 파일(dist, node_modules 등)이 커밋에 포함되지 않음
- [ ] `src/common/` 변경 시 MCP 서버·CLI·문서 생성 세 경로 모두 확인
