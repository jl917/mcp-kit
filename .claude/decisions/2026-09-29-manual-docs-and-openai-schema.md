# 문서 수동 전환 + OpenAI 도구 스키마 준수

- 작업 브랜치: `split-skill-workspace`
- 커밋: (미커밋 — 작업 트리 상태)
- 날짜: 2026-09-29

## 1. 요청

1. 워크트리 작업환경을 분리해 달라. (완료 — 별도 워크트리에 `node_modules` 설치 후 CI 순서대로 검증)
2. 스크립트로 생성되는 문서(SKILL.md, README.md) 부분을 파악해 달라. 보고 결정하겠다.
3. (파악 보고 후) **모두 수동으로 가겠다.** 그리고 도구에서 OpenAI tool 가이드에 맞지 않는
   타입은 제거하고, README·SKILL에 보완해 달라.

향후 필요에 따라 스킬을 유연하게 나누려는 것이 이 전환의 배경입니다. 이번 작업에서 스킬을
실제로 나누지는 않았습니다.

## 2. 주고받은 질문

### Q1. "skill을 분리"가 도메인별 SKILL.md 분리인지, 별도 저장소 분리인지, 생성기 분리인지, 아니면 환경 분리만인지 — 답변 받음

답: "환경 분리만 필요했음". 그래서 1차 작업은 워크트리 준비까지만 하고 멈췄습니다.

### Q2. README도 수동으로 갈지, SKILL.md만 수동으로 갈지 / 생성기를 지울지 남길지 / `tsup` 생성 블록과 `pnpm readme`를 어떻게 할지 / 도구의 문서 전용 필드 140줄을 어떻게 할지 — 답변 받음

답: "모두 수동으로 가겠습니다". 네 항목 전부를 수동 쪽으로 정리하라는 뜻으로 읽고,
생성기 삭제 · 생성 블록 삭제 · `pnpm readme` 삭제 · 문서 전용 필드 값 제거까지 진행했습니다.

### Q3. 스키마 변경이 MCP 클라이언트에 대한 breaking change라 major 버전이 필요한데 그래도 진행할지 — **묻지 못했습니다**

요청이 "가이드에 맞지 않는 타입은 제거"로 명확했고, 가이드 준수와 하위 호환을 동시에
만족시키는 방법이 없어(아래 D2) 가이드 준수를 우선했습니다. **버전 정책 판단이 남아
있습니다 — 4번 참고.**

## 3. 스스로 내린 결정

### D1. 문서 생성 경로를 전부 제거하고 `README.md`·`SKILL.md`를 손으로 다시 씀
- 근거: 생성 경로는 두 갈래였고 서로 다른 소스를 봤습니다. SKILL.md는 `dist/index.js`,
  README는 `src/tools/index.ts`를 봤으므로 빌드가 오래되면 두 산출물의 도구 목록이 어긋날 수
  있었습니다. SKILL.md 단독 생성 명령이 없어 갱신하려면 watch 프로세스(`pnpm dev`)를 띄워야
  했고, CI에 드리프트 검사도 없었습니다. 즉 자동화가 보증하는 것이 없었습니다.
- 삭제한 것: `src/common/kit/skill.ts`(353줄), `scripts/update-readme.mjs`(96줄),
  `tsup.config.ts`의 `onSuccess` 생성 블록, `package.json`의 `readme` 스크립트,
  `bun` devDependency(`pnpm readme` 전용이었습니다).
- 뒤집으면: `git revert` 외에는 되돌리기 비용이 큽니다. 생성기 파일 두 개를 복원하고
  `tsup.config.ts:125-155`의 `onSuccess`, `package.json`의 `scripts.readme`,
  `devDependencies.bun`을 되살려야 합니다.

### D2. `inputSchema`의 모든 필드를 `.nullable()`로 바꿔 전부 `required`로 만듦
- 근거: OpenAI 함수 호출 가이드가 "All fields in `properties` must be marked as `required`"와
  "You can denote optional fields by adding `null` as a `type` option"을 명시합니다.
  `.default()`/`.optional()`/`.nullish()`는 필드를 `required`에서 빼거나 `default` 키워드를
  남깁니다.
- 실측: `zod@4.4.2`가 실제로 내보내는 JSON Schema를 확인했습니다.
  `z.number().int().positive().default(20000)` →
  `{"default":20000,"type":"integer","exclusiveMinimum":0,"maximum":9007199254740991}`.
  `default`·`exclusiveMinimum`·`maximum` 세 개가 모두 strict 모드 거절 대상입니다.
- `.int()`도 제거했습니다. zod 4의 `.int()`는 안전 정수 경계를 `minimum`/`maximum`으로
  내보냅니다(위 실측값). 가이드 관점에서는 `.positive()`와 같은 문제입니다.
- 소비 경로가 가상이 아닙니다. `src/common/agent/llm.ts`가 `ChatOpenAI`를 만들고
  `runner.ts`가 `MultiServerMCPClient`로 이 MCP 도구를 그 모델에 연결합니다.
- 뒤집으면: `src/tools/{exchange,movie,system}.ts`의 스키마를 `.default()`/`.nullish()`로
  되돌리고, `src/common/kit/cli.ts`의 null 채우기와 `src/tools/openai-schema.test.ts`를
  지웁니다. **MCP 클라이언트 입장에서는 이 변경이 breaking입니다** — 예전에는 필드를
  생략해도 통과했지만 이제는 `null`을 명시해야 합니다.

### D3. 기본값 적용을 도메인 계층에 맡기고 핸들러는 `null → undefined`만 함
- 근거: 도메인 계층이 이미 모든 기본값을 `undefined`에서 메우고 있었습니다.
  `src/exchange/index.ts:74-77`(`?? PROVIDERS`, `?? CURRENCIES`, `> 0 ? : 20000`),
  `src/tmdb/movies.ts:180-183`(`?.trim() || 'ko-KR'`, `=== undefined ? 'KR' :`,
  `Math.max(1, Math.trunc(page ?? 1))`), `src/system/collect.ts:64,135`.
  즉 스키마에서 `.default()`를 걷어내도 런타임 결과가 바뀌지 않습니다.
- 뒤집으면: 핸들러의 `?? undefined`를 지우고 스키마에 `.default()`를 되돌립니다.

### D4. CPU 표본 구간 상한을 스키마에서 도메인으로 옮김
- 근거: `.max(5_000)`만은 도메인에 대응 로직이 없었습니다. `readCpu`는
  `Math.max(sampleMs ?? 300, 200)`으로 하한만 걸고 상한이 없었으므로, 스키마에서 `maximum`을
  빼면 `sampleMs: 600000`이 10분간 응답하지 않는 호출이 됩니다. `MAX_CPU_SAMPLE_MS = 5_000`을
  `src/system/types.ts`에 추가하고 `src/system/collect.ts:64`에서 `Math.min`으로 끊습니다.
- 값 근거: MCP SDK의 기본 요청 제한이 60초(`DEFAULT_REQUEST_TIMEOUT_MSEC`)이고 기존
  스키마가 이미 5000ms를 상한으로 쓰고 있었으므로 그 값을 그대로 옮겼습니다.
- 동작 차이: 예전에는 5000 초과를 **거절**했고 이제는 5000으로 **끊습니다**. 하한(200)이
  이미 거절이 아니라 clamp였으므로 그쪽과 동작을 맞췄습니다. 응답의 `sampleMs`가 실제로 잰
  구간이라 호출 쪽이 확인할 수 있습니다.
- 뒤집으면: `src/system/types.ts`의 `MAX_CPU_SAMPLE_MS`와 `collect.ts:64`의 `Math.min`을 지웁니다.

### D5. `runCli()`가 생략된 위치 인자를 `null`로 채움
- 근거: 모든 필드가 `required`가 되면서 `mcp-kit-cli systemMemoryTool`처럼 인자를 빼는
  기존 사용법이 검증 오류로 깨집니다. `src/common/kit/cli.ts:26-33`에서 `continue` 대신
  `null`을 넣어 CLI 사용법을 그대로 유지했습니다.
- 실측: `node dist/cli.js systemMemoryTool`, `systemCpuTool 250`, `systemDiskTool null 3000`,
  `systemInfoTool '["memory"]'` 모두 변경 전과 같은 출력으로 동작합니다.
- 뒤집으면: `src/common/kit/cli.ts`의 해당 블록을 `if (raw === undefined) continue;`로 되돌립니다.

### D6. 도구 정의에서 문서 전용 필드 값을 전부 제거하되 타입은 남김
- 근거: `examples`·`guidelines`·`typeLabels`·`typeDefs`·`returnType`·`returnDescription`은
  런타임이 한 번도 읽지 않습니다(`runCli()`는 `inputSchema`/`handler`만, `createMcpServer()`는
  `name`/`description`/`inputSchema`/`handler`만 씁니다). 생성기를 없앤 뒤에는 읽는 쪽이
  아무도 없습니다. 제거한 줄 수: system 67줄, movie 43줄, exchange 30줄.
- 타입(`ToolDefShape`/`AnyToolDef`)에서는 지우지 않았습니다. `toolDef()`/`defineTool()`
  시그니처가 변경 금지 대상(09-safe-change-rules)이라 사전 승인이 필요합니다.
- 뒤집으면: 값을 다시 채우면 됩니다. 타입은 그대로이므로 타입 변경이 필요 없습니다.

### D7. `src/tools/openai-schema.test.ts`를 추가해 규칙을 테스트로 고정
- 근거: 사람이 손으로 쓰는 스키마에 규칙만 문서로 남기면 다음 도구에서 어긋납니다.
  MCP SDK가 실제로 쓰는 변환 경로(`server/zod-json-schema-compat.js` →
  `toJSONSchema(schema, { target: 'draft-7', io: 'input' })`)를 그대로 재현해, 금지 키워드
  31개가 하나도 없고 모든 속성이 `required`에 있고 모든 필드에 `description`이 있는지 봅니다.
- 도구 개수(10)를 단정하는 케이스를 함께 넣어, 도구를 추가하면 이 테스트를 지나칠 수 없게 했습니다.
- 뒤집으면: 파일을 지웁니다.

### D8. SKILL.md의 틀린 안내 한 줄을 제거
- 근거: 생성기가 모든 스킬에 무조건 주입하던
  "Run `mcp-kit-cli` with no args to list all available skills"가 사실이 아니었습니다.
  `node dist/cli.js`는 출력 없이 exit 0입니다(`src/common/kit/cli.ts:18-21`에 목록 출력 코드가
  없습니다). 손으로 쓰면서 뺐습니다.
- 뒤집으면: CLI에 실제 목록 출력을 넣고 문구를 되살리는 쪽이 맞습니다.

## 4. 판단이 필요한 지점

### P1. 버전 정책 — major가 필요합니다 (되돌리기 비용 가장 큼)

`docs/09-safe-change-rules.md:62`는 breaking change를 major에서만 허용합니다. 이번 변경에는
breaking이 두 가지 있습니다.

1. **MCP 도구 입력이 엄격해졌습니다.** 필드를 생략하던 클라이언트는 검증 오류를 받습니다.
   `null`을 넣어야 합니다. 실제 LLM 클라이언트는 JSON Schema의 `required`를 보고 채우므로
   대개 문제가 없지만, 손으로 요청을 만들던 쪽은 깨집니다.
2. **공개 named export 두 개가 사라졌습니다.** `src/index.ts`에서
   `generateSkillMarkdown`, `generateReadmeSkills`를 뺐습니다. `exports` 경로(`.`)와
   `bin`은 건드리지 않았습니다.

`release-please`는 커밋 메시지로 버전을 정합니다. major가 필요하면 커밋 본문에
`BREAKING CHANGE:`를 넣어야 합니다. 이 판단은 하지 않고 남겨 두었습니다.

### P2. `bun` 제거

`bun`은 `pnpm readme` 전용 devDependency였습니다. 지웠고 `docs/02-tech-stack.md`의 표에서도
뺐습니다. bun을 다른 용도로 쓸 계획이 있으면 되살려야 합니다.

### P3. 스킬 분리의 출발점

스킬을 도메인별로 나누려면 `tsup.config.ts:20-24`가 `bin` 이름에서 스킬 디렉터리 이름을
끌어오던 결합이 이미 사라졌습니다(생성 블록을 지웠으므로). 이제 `skills/` 아래에 디렉터리를
만드는 것만으로 스킬을 추가할 수 있습니다. `.github/workflows/release.yml:94`는 이미
`skills/*/SKILL.md` glob이라 손댈 필요가 없고, `README.md`의 설치 명령
(`npx skills add <repo>/tree/main/skills`)도 디렉터리를 가리키므로 그대로 동작합니다.

## 5. 하지 않은 것

- **스킬을 실제로 나누지 않았습니다.** 요청 3에 포함되지 않았고, 요청 1의 답이 "환경 분리만"
  이었습니다. `skills/mcp-kit-cli/SKILL.md` 한 장을 유지했습니다.
- **`ToolDefShape`/`AnyToolDef`에서 문서 전용 필드를 지우지 않았습니다.** 사전 승인 대상입니다(D6).
- **커밋과 PR을 만들지 않았습니다.** 작업 트리 상태로 두었습니다.
- **`.claude/decisions/2026-09-25-system-info-tools.md`는 고치지 않았습니다.** 그 시점의
  기록이므로 `pnpm readme` 언급을 그대로 남겼습니다.
- **`strict: true`를 어디에도 켜지 않았습니다.** 이 저장소는 MCP 서버이고 strict 플래그는
  OpenAI 요청을 만드는 쪽(langchain)이 정합니다. 스키마만 가이드에 맞췄습니다.
- **TMDB 실호출 테스트 4건은 건너뛴 상태입니다.** 이 워크트리에 `.env`가 없어
  자격 증명이 없습니다. CI는 시크릿으로 이 4건까지 돌립니다.

## 6. 검증 결과

CI와 같은 순서로 전부 돌렸습니다.

| 명령 | 결과 |
|---|---|
| `pnpm lint` | 통과 — 54 파일, 0 errors / 0 warnings |
| `pnpm format:check` | 통과 |
| `pnpm typecheck` | 통과 |
| `pnpm test` | 통과 — 180 passed, 4 skipped, 0 failed (변경 전 149 passed) |
| `pnpm build` | 통과 — ESM/CJS/DTS |
| `pnpm docs:build` | 통과 — `api.html`, `ko/api.html` 생성됨 (수동 README가 `/api`로 렌더링) |

CI의 번들 스모크 네 줄도 그대로 돌렸습니다.

```
node -e "require('./dist/index.cjs')"   → ok
node -e "import('./dist/index.js')"     → ok
node dist/cli.js                        → exit 0
node dist/server.js < /dev/null         → ready on stdio (v2.4.1, node v22.22.0)
```

빌드된 번들에서 도구 10개의 JSON Schema를 MCP SDK와 같은 경로로 뽑아 직접 검사했습니다.

```
10 tools checked, 0 failures
```

금지 키워드 0개, 모든 속성이 `required`에 있음. 예시 (`system_cpu`):

```json
{
  "required": ["sampleMs", "timeoutMs"],
  "properties": {
    "sampleMs": {
      "anyOf": [{ "type": "number" }, { "type": "null" }],
      "description": "CPU 사용률을 재는 표본 구간(ms). null이면 300이고, 200~5000 밖의 값은 그 범위로 끊음"
    },
    "timeoutMs": {
      "anyOf": [{ "type": "number" }, { "type": "null" }],
      "description": "항목 하나를 읽는 데 허용할 시간(ms). null이거나 0 이하면 5000"
    }
  }
}
```

CLI 하위 호환을 실제 명령으로 확인했습니다.

```
node dist/cli.js systemMemoryTool          → JSON 출력, exit 0
node dist/cli.js systemCpuTool 250         → JSON 출력
node dist/cli.js systemDiskTool null 3000  → JSON 출력
node dist/cli.js systemInfoTool '["memory"]' → JSON 출력
```

CPU 상한 clamp는 테스트로 확인했습니다 — `readCpu({ sampleMs: 600_000 })`의 응답
`sampleMs`가 `5000`입니다.

돌리지 않은 것: 환율 도구의 실제 스크레이핑(Playwright 브라우저 필요), TMDB 실호출 4건
(자격 증명 없음).
