# 시스템 정보 도구 (배터리 · 메모리 · CPU · 디스크)

- 작업 브랜치: `system-info-tool-setup`
- 커밋: `dc146ee` (기능) — 이 기록은 후속 커밋에 포함
- 날짜: 2026-09-25

## 1. 요청

세 번에 걸쳐 들어왔고, 두 번째와 세 번째가 도구 구성을 바꿨습니다.

1. "시스템 정보를 제공하는 기능을 개발합니다. 작업환경 셋팅해주세요"
   → 의존성 설치와 기준선 검증까지. 기능 구현은 범위 밖.
2. "배터리, cpu, memory, 하드 정보를 볼려고 합니다. `systeminformation` 패키지를 기반으로"
   배터리 사용/충전/잔량, 메모리 총량과 사용량, CPU 사용률, 디스크 잔여 용량을 제공하는 유틸.
3. 작업 도중 추가 — "한꺼번에 모든 체크 하지 않고 사용자는 cpu, memory, 배터리 별로 각각 필요
   할수도 있으니 나눠서 구현 해주세요. 필요시 agent에서 도구를 여러번 호출하면 되니까요."
   이어서 — "도구에서 파라미터로 어떤게 필요한지를 던지면 한번에도 가능하니.. 이렇게 구현하면
   성능이 좋겠죠?"

3번이 도착한 시점에는 도메인 계층 설계만 끝난 상태였고, 도구 파일을 쓰기 전이어서 구성을
항목별 4개 + 통합 1개로 바꿔 반영했습니다.

## 2. 주고받은 질문

### Q1. "시스템 정보"의 범위는 무엇입니까 — 답변 받음

세 가지를 제시했습니다. (1) 호스트 하드웨어 상태(OS·CPU·메모리·업타임·네트워크·디스크),
(2) 런타임 정보(Node 버전, 프로세스 메모리, PID, 실행 경로), (3) 서버 자체 진단 정보
(mcp-kit 버전, 등록된 도구 목록, 자격 증명 설정 여부).

→ (1)을 선택하고 범위를 배터리·메모리·CPU·디스크 네 항목으로, 수집 수단을
`systeminformation`으로 지정받았습니다. (2)와 (3)은 만들지 않았습니다.

### Q2. 호스트 식별 정보를 기본 응답에 포함할지 — **답변 없음**

Q1과 함께 물었습니다. "1번이면 호스트 정보가 MCP 클라이언트로 그대로 나가므로, 홈 디렉터리
경로·호스트명·사용자명 같은 식별 정보를 기본 응답에 포함할지도 함께 정하는 편이 좋습니다."
답을 받지 못한 상태로 진행했고, **포함하지 않는 쪽으로 가정**했습니다.

현재 응답에 호스트명·사용자명·홈 경로는 없습니다. 다만 완전히 없는 것은 아닙니다.

- `system_disk`는 마운트 경로(`mount`)와 장치 이름(`fs`)을 돌려줍니다.
- 기본값(`allDisks: false`)에서는 볼륨 하나뿐이라 `/System/Volumes/Data`, `/` 같은 고정 경로입니다.
- `allDisks: true`를 주면 외장 볼륨 이름이 그대로 나옵니다. 이 기계에서는
  `/Volumes/Bionic 1.1.5+1-arm64`, `/Volumes/Laya`가 나왔습니다. 볼륨 이름은 사용자가 붙인
  것이라 식별 정보가 될 수 있습니다.

→ 4번 항목에 판단 요청으로 남겼습니다.

### Q3. 항목을 나눌지, 한 번에 받을지 — 답변 받음 (요청 3번)

"나눠서 구현" + "파라미터로 어떤 게 필요한지 던지면 한 번에도 가능" → 둘 다 만들었습니다.

### Q4. "이렇게 구현하면 성능이 좋겠죠?" — 답변함

측정해서 답했습니다. 통합 경로는 항목을 동시에 읽으므로 비용이 "합계"가 아니라 "가장 느린
항목"에 수렴합니다. 이 기계 실측값은 6번 항목에 있습니다. 결론은 두 경로를 다 두는 게 맞고,
CPU가 포함되면 나머지 항목은 사실상 공짜입니다.

## 3. 스스로 내린 결정

### D1. 도구 다섯 개, 이름은 `system_*`

`system_battery` / `system_memory` / `system_cpu` / `system_disk` / `system_info`.
통합 도구는 `sections` 배열로 항목을 고릅니다.

- 근거: 요청 3번. 이름은 08-file-creation-rules의 규칙(MCP 노출 이름은 `snake_case`,
  변수는 `camelCase` + `Tool`)을 따랐습니다.
- 뒤집으면: **배포 후에는 되돌릴 수 없습니다.** 09-safe-change-rules가 도구 `name` 변경을
  금지하고, 바꾸려면 새 도구를 추가하고 옛 도구에 폐기 안내를 넣어야 합니다. 이름을 바꿀
  기회는 릴리스 전인 지금뿐입니다. 고칠 곳은 `src/tools/system.ts`의 `name` 필드.

### D2. 응답은 순수 JSON — 사람이 읽는 요약 문자열을 넣지 않음

크기는 모두 바이트, 비율은 모두 퍼센트로 내보냅니다. `"24.0 GB / 32.0 GB (70.2%)"` 같은
요약 줄을 넣는 안을 검토하고 뺐습니다.

- 근거: 기존 도구(`exchange_*`, `movies_*`)가 모두 정규화된 순수 JSON만 돌려줍니다. 요약
  문자열은 숫자와 별개로 관리되는 두 번째 표현이 되어 서로 어긋날 자리를 만듭니다.
  `usedPercent`를 미리 계산해 넣었으므로 "몇 % 쓰고 있나"는 계산 없이 바로 답이 됩니다.
- 뒤집으면: CLI로 직접 읽을 때 `"totalBytes": 34359738368`을 눈으로 환산해야 합니다.
  필요하면 `src/system/types.ts`에 `*Text` 필드를 더하고 `src/system/normalize.ts`에서 채웁니다.

### D3. 메모리 사용량은 `used`가 아니라 `active`

- 근거: macOS·Linux의 `used`는 캐시와 버퍼를 포함합니다. 이 기계에서 `used`는 32.7GB(95%),
  `active`는 24.1GB(70.8%)로 나왔습니다. 95%는 여유가 10GB 있는 기계를 위험하다고 보고하는
  틀린 답입니다. 회수 가능한 몫은 `cachedBytes`로 따로 담았습니다.
- 뒤집으면: `src/system/normalize.ts`의 `toMemoryInfo()`에서 `raw.active`를 `raw.used`로.
  `src/system/normalize.test.ts`의 "should count active memory as used" 테스트가 같이 깨집니다.

### D4. CPU는 표본을 두 번 떠서 그 사이 구간만 계산

`sampleMs` 기본 300ms, 하한 200ms, 상한 5000ms.

- 근거: `systeminformation`의 `currentLoad()`는 앞선 호출과의 차이를 돌려줍니다. 프로세스의
  첫 호출은 비교 대상이 없어 **부팅 이후 평균**이 나옵니다. 실측으로 확인했습니다 —
  첫 호출 38.878%, 300ms 뒤 두 번째 호출 28.477%. 하한 200ms는 라이브러리가 200ms 안의
  재호출에 캐시된 값을 그대로 돌려주기 때문입니다(`node_modules/systeminformation/lib/cpu.js`의
  `now >= 200` 분기). 그보다 짧게 요청받아도 200ms까지 기다립니다.
- 뒤집으면: 이 도구가 느려도 되는 대신 정확도를 포기하려면 `src/system/collect.ts`의
  `readCpu()`에서 첫 호출과 대기를 지웁니다. 그러면 값이 부팅 이후 평균이 됩니다.

### D5. 디스크는 기본적으로 볼륨 하나만, macOS는 `/`가 아니라 데이터 볼륨

- 근거: macOS는 APFS 컨테이너 하나를 여러 볼륨으로 쪼개고 `/`에 읽기 전용 시스템 스냅샷을
  올립니다. 이 기계에서 `/`는 사용률 2.76%, `/System/Volumes/Data`는 53.8%로 나왔습니다.
  `/`를 읽으면 "1TB 중 97% 남음"이라는 틀린 답이 됩니다. `df`가 보고하는 10개 볼륨을 전부
  돌려주는 안도 검토했지만, 같은 컨테이너를 쓰는 볼륨들의 `availableBytes`가 서로 겹쳐
  합산이 불가능해 기본값에서 뺐습니다.
- 뒤집으면: `allDisks: true`로 호출하면 지금도 전부 나옵니다. 기본값을 바꾸려면
  `src/system/normalize.ts`의 `pickPrimaryDisk()`. Windows는 작업 디렉터리가 놓인 드라이브,
  그 밖은 `/`, 아무것도 맞지 않으면 가장 큰 볼륨을 고릅니다.

### D6. `usedPercent`는 `df` 기준

`usedBytes / (usedBytes + availableBytes)`로 계산합니다. `usedBytes / totalBytes`가 아닙니다.

- 근거: `totalBytes`에는 예약 블록이 섞여 있어 그대로 나누면 낮게 나옵니다. 이 기계의 데이터
  볼륨은 `df` 기준 53.8%, `size` 기준 51.9%입니다. `df`와 다른 숫자를 내면 사용자가 터미널에서
  본 값과 어긋납니다.
- 뒤집으면: `src/system/normalize.ts`의 `toDiskUsage()`.

### D7. 배터리 — `powerSource`와 `isCharging`을 분리, 모르는 값은 `null`

- 근거: 완충 상태로 어댑터에 꽂아 두면 `acConnected: true`, `isCharging: false`입니다. 하나로
  합치면 "충전 중이 아님"이 "배터리로 돌고 있음"으로 잘못 읽힙니다. `systeminformation`은 모르는
  값을 `0`이나 `-1`로 채우는데, 그대로 두면 "0분 남음", "사이클 0회"라는 틀린 사실이 됩니다.
  `healthPercent`는 설계 용량을 넘기는 배터리가 있어 100에서 자르지 않았습니다.
- 뒤집으면: `src/system/normalize.ts`의 `toBatteryInfo()`.

### D8. 요청하지 않은 항목은 필드째 빼고, 실패한 항목은 `null` + `errors`

- 근거: `null` 하나로 "요청 안 함", "읽기 실패", "배터리 없는 기계"를 다 표현하면 구분이
  안 됩니다. 지금은 필드가 없으면 요청하지 않은 것, `null`이면서 `errors`에 있으면 실패,
  `null`이면서 `errors`에 없으면 배터리가 없는 기계입니다.
- 뒤집으면: `src/system/collect.ts`의 `readSnapshot()`.

### D9. 항목마다 `timeoutMs`(기본 5000ms)

- 근거: `systeminformation`은 항목마다 외부 명령(`ioreg`, `vm_stat`, `df` 등)을 실행합니다.
  그 명령이 응답하지 않으면 도구 호출이 끝나지 않습니다. 기존 도구도 모두 `timeoutMs`를
  노출하고 있어 같은 모양을 따랐습니다.
- 뒤집으면: `src/system/types.ts`의 `DEFAULT_TIMEOUT_MS`.

### D10. `systeminformation`을 번들에 인라인 유지 (번들 604KB → 927KB)

- 근거: `tsup.config.ts`의 `noExternal`이 `playwright`만 빼고 전부 인라인하는 현행 설계를
  유지했습니다. `external`로 돌리면 번들은 줄지만 설치 시점 의존성이 늘고, 09-safe-change-rules가
  사전 승인 대상으로 지정한 필드를 건드려야 합니다.
- 뒤집으면: `tsup.config.ts`의 `external`/`noExternal` — **사전 승인 필요**.

### D11. ESM 출력에 `require` 심 추가 (빌드 설정 변경)

- 근거: 위 D10의 결과로 CJS 패키지인 `systeminformation`이 번들 안에 들어오는데, 이 패키지는
  자기 모듈에서 `require('os')`를 부릅니다. esbuild는 이 호출을 "런타임에 `require`가 있으면
  쓰고 없으면 던진다"로 남기고 ESM에는 `require`가 없어서, **도구를 하나도 부르기 전에**
  `dist/*.js`를 불러오는 순간 `Dynamic require of "os" is not supported`로 죽었습니다.
  내장 모듈을 `external`로 돌리는 방법을 먼저 시도했지만 통하지 않았습니다 —
  `noExternal: [/^(?!playwright)/]`가 `os` 같은 맨 이름까지 잡고 `external`보다 우선합니다.
  보호 대상인 `external`/`noExternal`을 건드리지 않는 방법으로, `esbuildOptions`에서
  **ESM 형식에만** 배너를 붙여 `node:module`로 `require`를 만들었습니다. CJS에는 이미 진짜
  `require`가 있어 충돌하므로 `context.format`으로 갈랐습니다.
- 뒤집으면: 되돌릴 수 없습니다 — 빼면 ESM 번들이 못 뜹니다. `docs/09-safe-change-rules.md`와
  `CLAUDE.md`에 변경 금지 항목으로 적어 두었습니다.

### D12. `.env`를 만들지 않음

- 근거: `tsup.config.ts`의 `embeddedCredentials()`가 빌드 때 `.env`의 `TMDB_API_KEY`를 번들에
  심습니다. `.env.example`을 그대로 복사하면 플레이스홀더 값이 번들에 박힙니다. 이번 기능은
  자격 증명이 필요 없습니다.
- 뒤집으면: TMDB 도구를 함께 만질 때 실제 키를 넣어 `.env`를 만듭니다.

## 4. 판단이 필요한 지점

되돌리기 비용이 큰 것부터 적었습니다.

1. **도구 이름 (D1).** `system_battery` / `system_memory` / `system_cpu` / `system_disk` /
   `system_info`로 확정할지. 릴리스 후에는 바꿀 수 없습니다. 지금이 마지막 기회입니다.
2. **마운트 경로 노출 (Q2, 답변 없음).** `allDisks: true`일 때 외장 볼륨 이름이 그대로
   나갑니다(`/Volumes/Laya` 등). 그대로 둘지, 장치 이름만 남기고 가릴지, `allDisks`를 아예
   없앨지 정해 주십시오. 기본 호출에는 영향이 없습니다.
3. **응답 형식 (D2).** 바이트 숫자만으로 충분한지, 사람이 바로 읽는 문자열도 필요한지.
   MCP 클라이언트(LLM)는 바이트로 충분하지만 CLI로 직접 읽을 때는 환산이 필요합니다.
4. **번들 크기 (D10).** 927KB를 받아들일지, `systeminformation`을 설치 시점 의존성으로
   돌려 번들을 줄일지. 후자는 사전 승인 대상 필드를 건드립니다.
5. **CPU 기본 표본 구간 (D4).** 300ms가 도구 호출 지연으로 적당한지. 줄이면 값이 흔들리고,
   200ms 아래로는 내려갈 수 없습니다.

## 5. 하지 않은 것

- **런타임 정보와 서버 자체 진단 도구** (Q1의 2번·3번 안) — 범위에서 선택되지 않았습니다.
- **네트워크·GPU·프로세스 목록** — 요청에 없었습니다. 추가하려면 `SECTIONS`에 이름을 넣고
  `normalize.ts`·`collect.ts`에 함수를 더하는 순서로 확장됩니다.
- **`VERSION` 불일치 (미수정).** `src/common/constants.ts:5`가 `2.1.0`인데 `package.json`은
  `2.3.0`입니다. MCP `initialize` 응답에 구버전이 실려 나갑니다. 릴리스 버전 정합성 문제라
  이번 범위 밖으로 두고 보고했습니다.
- **CLI 문서 불일치 (미수정).** `docs/05-cli-interface.md`는 인자 없이 CLI를 실행하면 도구
  목록이 출력된다고 적었지만, `runCli()`는 아무것도 출력하지 않고 종료합니다
  (`src/common/kit/cli.ts:18-21`). 문서와 구현 중 어느 쪽을 고칠지 결정이 필요합니다.
- **푸시와 PR** — 로컬 커밋까지만 했습니다.

## 6. 검증 결과

CI와 같은 순서로 전부 돌렸습니다.

```
pnpm lint          0 errors / 0 warnings (54 files, 68 rules)
pnpm format:check  통과
pnpm typecheck     통과
pnpm test          148 passed / 4 skipped / 0 failed   (기능 추가 전 91 → 신규 57)
pnpm build         ESM · CJS · DTS 성공
pnpm readme        README 재생성, SKILL.md 재생성 (도구 10개)
```

빌드 산출물 실동작 확인 — 테스트만으로는 D11의 번들 문제를 잡을 수 없었습니다.

- ESM CLI: 도구 5개 모두 정상 출력
- CJS 번들: `require('./dist/index.cjs')` 후 `readSnapshot()` 정상, `tools` 10개
- MCP 서버 stdio: `initialize` → `tools/list`(10개) → `tools/call system_info` 정상

성능 실측 (이 기계, `dist/index.js`):

```
개별 4회 순차 (agent가 4번 호출)  917ms
system_info 1회 (4항목 동시)      356ms
system_cpu 단독                   301ms
system_battery 단독                47ms
system_memory 단독                 21ms
system_disk 단독                   49ms
```

통합 호출이 2.6배 빠르고, 그 시간은 CPU 단독 호출 시간에 수렴합니다.

수치 판단의 근거로 쓴 실측값:

| 항목 | 원본 값 | 내보내는 값 |
|---|---|---|
| 메모리 사용률 | `used` 기준 95% | `active` 기준 70.8% |
| 디스크 사용률 | `/` 2.76% | `/System/Volumes/Data` 53.8% |
| 디스크 사용률 기준 | `size` 기준 51.9% | `df` 기준 53.8% |
| CPU 사용률 | 첫 호출 38.878% (부팅 이후 평균) | 두 번째 호출 28.477% (300ms 구간) |
