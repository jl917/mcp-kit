# @julong/mcp-kit

Use this skill to fetch KRW exchange rates, TMDB movie listings, and local system metrics via the mcp-kit CLI. Scrapes Naver, Google, and Daum with Playwright for USD, CNY, JPY, and EUR rates, reads now playing, upcoming, and recommended movies from the TMDB v3 API, and reports battery, memory, CPU, and disk usage of the machine it runs on.

> 이 문서는 손으로 관리합니다. `src/tools/`의 도구를 추가·변경하면 이 파일과
> `skills/mcp-kit-cli/SKILL.md`를 함께 고칩니다. 생성 스크립트는 없습니다.

## MCP Server

### Configuration

MCP 클라이언트 설정에 아래를 추가합니다.

```json
{
  "mcpServers": {
    "@julong/mcp-kit": {
      "command": "npx",
      "args": ["-y", "@julong/mcp-kit"],
      "env": {
        "TMDB_API_KEY": "<value>"
      }
    }
  }
}
```

### Run

```sh
npx -y @julong/mcp-kit
```

노출할 도구를 골라야 하면 환경 변수로 거릅니다. 도구 `name`(snake_case)으로 맞춥니다.

| 변수 | 동작 |
|------|------|
| `WHITE_FN` | 쉼표로 나열한 도구만 노출. `BLACK_FN`보다 우선함 |
| `BLACK_FN` | 쉼표로 나열한 도구를 제외 |

## CLI

### Installation

```sh
npm install -g @julong/mcp-kit
# 또는
npx mcp-kit-cli <toolName> [...args]
```

### Usage

```sh
mcp-kit-cli <toolName> [...args]
```

`<toolName>`은 아래 표의 CLI 이름(camelCase)입니다. MCP 도구 이름(snake_case)과 다릅니다.

| CLI 이름 | MCP 도구 이름 | 하는 일 |
|----------|---------------|---------|
| `exchangeRatesTool` | `exchange_rates` | 포털별·통화별 원화 환율 |
| `exchangeRateTool` | `exchange_rate` | 포털 한 곳의 통화 하나 |
| `nowPlayingMoviesTool` | `movies_now_playing` | 현재 상영 중인 영화 |
| `upcomingMoviesTool` | `movies_upcoming` | 개봉 예정 영화 |
| `movieRecommendationsTool` | `movie_recommendations` | 추천 영화 |
| `systemBatteryTool` | `system_battery` | 배터리 잔량·전원 상태 |
| `systemMemoryTool` | `system_memory` | 메모리·스왑 사용량 |
| `systemCpuTool` | `system_cpu` | CPU 사용률 |
| `systemDiskTool` | `system_disk` | 파일 시스템 용량 |
| `systemInfoTool` | `system_info` | 위 네 항목을 한 번에 |

## Argument Rules

도구 스키마는 [OpenAI 함수 호출 가이드](https://developers.openai.com/api/docs/guides/function-calling)를
따릅니다. 그 결과 입력 규칙이 일반적인 JSON Schema와 다릅니다.

- **모든 필드가 `required`입니다.** 가이드가 `properties`의 모든 필드를 `required`에
  넣도록 요구합니다. 생략 가능한 필드는 없습니다.
- **값을 비우는 뜻은 `null`입니다.** 가이드가 정한 방식(`"type": ["string", "null"]`)
  그대로, 값을 주지 않겠다는 표시는 `null` 하나뿐입니다.
- **스키마에 기본값이 없습니다.** 가이드가 `default` 키워드를 받지 않습니다. 기본값은
  각 필드의 `description`에 적혀 있고, 실제 적용은 도메인 계층이 합니다.
- **스키마에 범위 제약이 없습니다.** `minimum`·`maximum`·`exclusiveMinimum`·
  `multipleOf` 같은 키워드도 받지 않습니다. 범위는 아래 표와 `description`에 적고,
  값을 거절하는 대신 도메인 계층이 범위로 끊습니다.

CLI는 생략한 자리를 `null`로 채웁니다. 그래서 명령줄에서는 뒤쪽 인자를 그냥 빼면
됩니다. 중간 인자만 비우려면 그 자리에 `null`을 넘깁니다.

```sh
mcp-kit-cli systemCpuTool              # sampleMs=null, timeoutMs=null
mcp-kit-cli systemCpuTool 500          # sampleMs=500, timeoutMs=null
mcp-kit-cli systemDiskTool null 3000   # allDisks=null, timeoutMs=3000
```

배열 인자는 JSON으로 넘기고, Unix 셸에서는 작은따옴표로 감쌉니다.

```sh
mcp-kit-cli systemInfoTool '["cpu","memory"]'
```

## Tools API Reference

### Exchange Rates

네이버·구글·다음을 Playwright로 실제로 열어 읽습니다. 한 번 호출에 수 초가 걸립니다.

처음 쓰기 전에 브라우저를 한 번 설치합니다.

```sh
npx playwright install chromium
```

공통 규칙

- 읽지 못한 통화는 `null`, 포털 자체를 열지 못하면 그 포털 전체가 `null`입니다.
- `rate`는 항상 1 통화 단위당 원화입니다. 포털이 100엔으로 고시해도 `rate`는 1엔
  기준이고, 화면 값은 `quotedRate`/`quotedUnit`에 남습니다.
- 포털마다 고시 시각과 기준(매매기준율 / 시장환율)이 달라 값이 조금씩 다를 수 있습니다.
- 한 번 호출은 통화를 몇 개 넣든 45초 안에 끝납니다. 시간이 모자라 못 읽은 통화는 `null`입니다.

```ts
interface ExchangeQuote {
  currency: 'USD' | 'CNY' | 'JPY' | 'EUR';
  base: 'KRW';
  /** 1 통화 단위당 원화 */
  rate: number;
  /** 포털 화면에 표시된 값 */
  quotedRate: number;
  /** quotedRate의 기준 단위 (일본 엔은 보통 100) */
  quotedUnit: number;
  /** 화면에서 읽은 원본 문자열 */
  raw: string;
  provider: 'naver' | 'google' | 'daum';
  url: string;
  fetchedAt: string;
}
```

#### `exchange_rates`

네이버·구글·다음에서 미국(USD)·중국(CNY)·일본(JPY)·유로(EUR)의 원화 환율을 가져옵니다.

```sh
mcp-kit-cli exchangeRatesTool [providers] [currencies] [timeoutMs]
```

| arg | type | null이면 | 설명 |
|-----|------|----------|------|
| `providers` | `("naver" \| "google" \| "daum")[] \| null` | 세 포털 전부 | 조회할 포털 목록 |
| `currencies` | `("USD" \| "CNY" \| "JPY" \| "EUR")[] \| null` | 네 통화 전부 | 조회할 통화 목록 |
| `timeoutMs` | `number \| null` | `20000` | 페이지 이동·요소 대기 하나에 허용할 시간(ms). 0 이하도 `20000` |

**Returns** `Record<Provider, Record<CurrencyCode, ExchangeQuote | null> | null>`

빈 배열을 넘기면 브라우저를 열지 않고 전부 `null`인 결과를 돌려줍니다.

```sh
mcp-kit-cli exchangeRatesTool '["naver"]' '["USD"]'
# → {"naver":{"USD":{"currency":"USD","base":"KRW","rate":1358.7,...},"CNY":null,"JPY":null,"EUR":null},"google":null,"daum":null}
```

#### `exchange_rate`

포털 한 곳에서 통화 하나의 원화 환율을 가져옵니다.

```sh
mcp-kit-cli exchangeRateTool <provider> <currency> [timeoutMs]
```

| arg | type | null이면 | 설명 |
|-----|------|----------|------|
| `provider` | `"naver" \| "google" \| "daum"` | (null 불가) | 조회할 포털 |
| `currency` | `"USD" \| "CNY" \| "JPY" \| "EUR"` | (null 불가) | 조회할 통화 |
| `timeoutMs` | `number \| null` | `20000` | 페이지 이동·요소 대기 하나에 허용할 시간(ms). 0 이하도 `20000` |

**Returns** `ExchangeQuote | null` — 읽지 못했으면 `null`

```sh
mcp-kit-cli exchangeRateTool daum JPY
# → {"currency":"JPY","base":"KRW","rate":8.723,"quotedRate":872.3,"quotedUnit":100,...}
```

### Movies (TMDB)

TMDB v3 API를 씁니다.

공통 규칙

- `TMDB_API_KEY`(v3 API 키) 또는 `TMDB_ACCESS_TOKEN`(읽기 액세스 토큰) 중 하나가
  필요합니다. 빌드에 심긴 자격 증명이 있으면 그대로 쓰고, 환경 변수를 주면 그 값이
  우선입니다.
- 기본값은 `language=ko-KR`, `region=KR`입니다. 한국 개봉 기준이 아니면 `region`을
  바꾸고, 지역을 빼려면 **빈 문자열**을 넘깁니다 (`null`은 기본값 `KR`입니다).
- 한 페이지는 최대 20편입니다. 더 필요하면 `page`를 올려 다시 호출합니다.
- `genres`는 TMDB 장르 목록을 언어별로 한 번 받아 이름으로 바꾼 값이고, 장르 목록을
  받지 못하면 빈 배열입니다.
- `dates`는 상영 중·개봉 예정 목록에만 있고 나머지는 `null`입니다.
- 인증 실패·조회 실패는 예외 대신 `Error: ...` 한 줄로 돌아옵니다.

```ts
interface MovieSummary {
  id: number;
  title: string;
  originalTitle: string;
  /** YYYY-MM-DD. 개봉일이 없으면 null */
  releaseDate: string | null;
  overview: string;
  /** 장르 id를 이름으로 바꾼 값. 이름을 찾지 못한 장르는 빠짐 */
  genres: string[];
  voteAverage: number;
  voteCount: number;
  popularity: number;
  posterUrl: string | null;
  tmdbUrl: string;
}

interface MovieListResult {
  kind: 'now_playing' | 'upcoming' | 'similar' | 'discover';
  language: string;
  /** 지역을 지정하지 않았으면 null */
  region: string | null;
  page: number;
  totalPages: number;
  totalResults: number;
  /** 상영 중·개봉 예정 목록이 알려 주는 집계 기간. 그 외에는 null */
  dates: { minimum: string | null; maximum: string | null } | null;
  /** similar 추천의 기준이 된 영화. discover면 null */
  basedOn: { id: number; title: string } | null;
  results: MovieSummary[];
}
```

세 도구가 공유하는 인자

| arg | type | null이면 | 설명 |
|-----|------|----------|------|
| `language` | `string \| null` | `"ko-KR"` | 응답 언어 (ISO 639-1 + ISO 3166-1) |
| `region` | `string \| null` | `"KR"` | 개봉 기준 지역 (ISO 3166-1). 빈 문자열이면 지역을 지정하지 않음 |
| `page` | `number \| null` | `1` | 조회할 페이지 번호. 1보다 작은 값은 `1`로 올림 |
| `timeoutMs` | `number \| null` | `10000` | 요청 하나에 허용할 시간(ms). 0 이하도 `10000` |

#### `movies_now_playing`

TMDB에서 현재 상영 중인 영화 목록을 가져옵니다. `dates`에 집계 기간이 함께 담깁니다.

```sh
mcp-kit-cli nowPlayingMoviesTool [language] [region] [page] [timeoutMs]
```

**Returns** `MovieListResult` — `kind: "now_playing"`, `basedOn`은 항상 `null`

```sh
mcp-kit-cli nowPlayingMoviesTool ko-KR KR
# → {"kind":"now_playing","language":"ko-KR","region":"KR","page":1,...}
```

#### `movies_upcoming`

TMDB에서 개봉 예정 영화 목록을 가져옵니다. `dates`에 집계 기간이 함께 담깁니다.

```sh
mcp-kit-cli upcomingMoviesTool [language] [region] [page] [timeoutMs]
```

**Returns** `MovieListResult` — `kind: "upcoming"`, `basedOn`은 항상 `null`

```sh
mcp-kit-cli upcomingMoviesTool ko-KR KR
# → {"kind":"upcoming","language":"ko-KR","region":"KR","page":1,...}
```

#### `movie_recommendations`

기준 영화를 주면 그 영화 기반 추천(`kind: "similar"`)을, 주지 않으면 이미 개봉한
인기작(`kind: "discover"`)을 돌려줍니다.

```sh
mcp-kit-cli movieRecommendationsTool [title] [movieId] [genre] [language] [region] [page] [timeoutMs]
```

기준 영화 인자 (위의 공통 인자 네 개가 뒤에 붙습니다)

| arg | type | null이면 | 설명 |
|-----|------|----------|------|
| `title` | `string \| null` | 기준 없이 추천 | 기준 영화 제목. 검색해서 첫 결과를 기준으로 삼음 |
| `movieId` | `number \| null` | `title`을 봄 | 기준 영화의 TMDB id. `title`보다 우선함 |
| `genre` | `string \| null` | 장르 필터 없음 | 기준 영화 없이 추천할 때만 적용할 장르 이름 또는 id (예: `액션`, `28`) |

**Returns** `MovieListResult` — `similar` 추천이면 `basedOn`에 기준 영화의 `{ id, title }`

- `title`과 `movieId`를 모두 비우면 기준 없이 이미 개봉한 인기작을 돌려줍니다.
- `genre`는 기준 영화가 없을 때만 적용됩니다. 기준 영화를 주면 TMDB 추천 목록을 그대로 씁니다.

```sh
mcp-kit-cli movieRecommendationsTool "인터스텔라"
# → {"kind":"similar","basedOn":{"id":157336,"title":"인터스텔라"},...}

mcp-kit-cli movieRecommendationsTool null null "액션"
# → {"kind":"discover","basedOn":null,"page":1,...}
```

### System

`systeminformation`으로 이 도구가 돌고 있는 기계를 읽습니다. 네트워크를 타지 않습니다.

공통 규칙

- 크기는 모두 바이트, 비율은 모두 퍼센트(0~100)입니다.
- 읽지 못하면 예외 대신 `Error: ...` 한 줄로 돌아옵니다.
- 항목이 하나만 필요하면 항목별 도구를, 둘 이상 필요하면 `system_info`에 `sections`를
  넘겨 한 번에 받습니다.

모든 도구가 공유하는 인자

| arg | type | null이면 | 설명 |
|-----|------|----------|------|
| `timeoutMs` | `number \| null` | `5000` | 항목 하나를 읽는 데 허용할 시간(ms). 0 이하도 `5000` |

#### `system_battery`

배터리 잔량과 전원 상태를 돌려줍니다.

```sh
mcp-kit-cli systemBatteryTool [timeoutMs]
```

**Returns** `BatteryInfo | null` — 배터리가 없는 기계면 `null`

```ts
interface BatteryInfo {
  /** 남은 용량(%) */
  percent: number;
  /** 실제로 충전되고 있는지 */
  isCharging: boolean;
  /** 지금 쓰는 전원. 어댑터에 꽂혀 있으면 "ac" */
  powerSource: 'ac' | 'battery';
  /** 배터리로 더 쓸 수 있는 시간(분). 충전 중이거나 읽지 못하면 null */
  timeRemainingMin: number | null;
  cycleCount: number | null;
  /** 설계 용량 대비 현재 최대 용량(%). 100에서 멀어질수록 노화된 배터리 */
  healthPercent: number | null;
  type: string | null;
  model: string | null;
}
```

- `powerSource`는 어댑터에 꽂혀 있는지, `isCharging`은 실제로 충전되고 있는지입니다.
  완충 상태로 꽂아 두면 `powerSource`는 `"ac"`, `isCharging`은 `false`입니다.
- `timeRemainingMin`은 배터리로 쓰는 동안만 값이 있고 충전 중에는 `null`입니다.

```sh
mcp-kit-cli systemBatteryTool
# → {"percent":100,"isCharging":false,"powerSource":"battery","timeRemainingMin":555,...}
```

#### `system_memory`

물리 메모리와 스왑 사용량을 돌려줍니다.

```sh
mcp-kit-cli systemMemoryTool [timeoutMs]
```

**Returns** `MemoryInfo`

```ts
interface MemoryInfo {
  totalBytes: number;
  /** 실제로 쓰고 있는 양. 캐시·버퍼는 빼고 셈 */
  usedBytes: number;
  /** 새 할당에 바로 내줄 수 있는 양 */
  availableBytes: number;
  /** totalBytes 대비 usedBytes(%) */
  usedPercent: number;
  /** 캐시·버퍼가 잡고 있는 양. 필요해지면 회수됨 */
  cachedBytes: number;
  /** 스왑을 쓰지 않는 환경이면 null */
  swap: { totalBytes: number; usedBytes: number; usedPercent: number } | null;
}
```

- `usedBytes`는 캐시·버퍼를 뺀 값이라 운영체제 도구가 보여 주는 "사용 중"보다 작습니다.
  회수 가능한 몫은 `cachedBytes`에 있습니다.

```sh
mcp-kit-cli systemMemoryTool
# → {"totalBytes":34359738368,"usedBytes":24105795584,"usedPercent":70.2,...}
```

#### `system_cpu`

표본 구간 동안의 CPU 사용률을 돌려줍니다.

```sh
mcp-kit-cli systemCpuTool [sampleMs] [timeoutMs]
```

| arg | type | null이면 | 설명 |
|-----|------|----------|------|
| `sampleMs` | `number \| null` | `300` | CPU 사용률을 재는 표본 구간(ms). `200`~`5000` 밖의 값은 그 범위로 끊음 |

**Returns** `CpuLoadInfo`

```ts
interface CpuLoadInfo {
  /** 표본 구간 동안의 사용률(%) */
  usagePercent: number;
  /** 사용률 중 사용자 코드 몫(%) */
  userPercent: number;
  /** 사용률 중 커널 몫(%) */
  systemPercent: number;
  /** 논리 코어 수 */
  cores: number;
  /** 코어별 사용률(%) */
  perCorePercent: number[];
  /** 코어 하나로 환산한 부하 평균. Windows는 null */
  loadAveragePerCore: number | null;
  /** 실제로 잰 표본 구간(ms) */
  sampleMs: number;
}
```

- `usagePercent`는 표본 구간 동안의 평균이며 순간값이 아닙니다.
- `sampleMs`를 늘리면 값이 안정되는 대신 호출이 그만큼 늦어집니다. 값을 거절하는 대신
  `200`~`5000`으로 끊으므로, 응답의 `sampleMs`가 실제로 잰 구간입니다.

```sh
mcp-kit-cli systemCpuTool 500
# → {"usagePercent":28.5,"userPercent":18.9,"cores":10,"sampleMs":500,...}
```

#### `system_disk`

파일 시스템 용량을 배열로 돌려줍니다.

```sh
mcp-kit-cli systemDiskTool [allDisks] [timeoutMs]
```

| arg | type | null이면 | 설명 |
|-----|------|----------|------|
| `allDisks` | `boolean \| null` | `false` | `true`면 마운트된 파일 시스템 전부, `false`면 기본 디스크 하나만 |

**Returns** `DiskUsage[]` — 읽을 볼륨이 없으면 빈 배열

```ts
interface DiskUsage {
  /** 마운트 지점 */
  mount: string;
  /** 장치 이름 */
  fs: string;
  /** 파일 시스템 종류 */
  type: string;
  totalBytes: number;
  usedBytes: number;
  /** 지금 더 쓸 수 있는 양 */
  availableBytes: number;
  /** usedBytes / (usedBytes + availableBytes)(%). df와 같은 기준 */
  usedPercent: number;
}
```

- 기본은 용량 질문에 답하는 볼륨 하나입니다. macOS는 사용자 데이터
  볼륨(`/System/Volumes/Data`), 그 밖의 환경은 루트(`/`)를 고릅니다.
- `allDisks`를 주면 외장 디스크와 시스템 볼륨까지 나옵니다. macOS APFS는 볼륨 여러 개가
  컨테이너 하나를 나눠 쓰므로 `availableBytes`가 서로 겹칩니다.
- `usedPercent`는 `df`와 같은 기준이므로 `usedBytes / totalBytes`와 다를 수 있습니다.

```sh
mcp-kit-cli systemDiskTool
# → [{"mount":"/System/Volumes/Data","totalBytes":994662584320,"availableBytes":442990383104,"usedPercent":53.8,...}]

mcp-kit-cli systemDiskTool true
# → [{"mount":"/",...},{"mount":"/Volumes/Backup",...}]
```

#### `system_info`

배터리·메모리·CPU·디스크 가운데 요청한 항목을 한 번에 읽습니다.

```sh
mcp-kit-cli systemInfoTool [sections] [sampleMs] [allDisks] [timeoutMs]
```

| arg | type | null이면 | 설명 |
|-----|------|----------|------|
| `sections` | `("battery" \| "memory" \| "cpu" \| "disk")[] \| null` | 네 항목 전부 | 읽을 항목 목록 |
| `sampleMs` | `number \| null` | `300` | CPU 사용률을 재는 표본 구간(ms). `200`~`5000` 밖의 값은 그 범위로 끊음 |
| `allDisks` | `boolean \| null` | `false` | `true`면 마운트된 파일 시스템 전부 |

**Returns** `SystemSnapshot`

```ts
interface SystemSnapshot {
  collectedAt: string;
  battery?: BatteryInfo | null;
  memory?: MemoryInfo | null;
  cpu?: CpuLoadInfo | null;
  disks?: DiskUsage[] | null;
  /** 읽지 못한 항목과 그 이유. 전부 읽었으면 빠짐 */
  errors?: Record<'battery' | 'memory' | 'cpu' | 'disk', string>;
}
```

- `sections`에 넣은 항목만 응답에 들어갑니다. 넣지 않은 항목은 필드째 빠집니다.
- 항목은 동시에 읽습니다. 네 항목을 다 물어도 CPU 하나를 물을 때와 걸리는 시간이 비슷합니다.
- 읽지 못한 항목은 `null`이 되고 이유가 `errors`에 담깁니다. `errors`에 없는 `null`
  배터리는 배터리가 없는 기계입니다.

```sh
mcp-kit-cli systemInfoTool '["cpu","memory"]'
# → {"collectedAt":"2026-09-25T01:15:00.000Z","memory":{...},"cpu":{...}}

mcp-kit-cli systemInfoTool '["battery"]'
# → {"collectedAt":"2026-09-25T01:15:00.000Z","battery":{"percent":100,...}}
```

## Environment Variables

| 변수 | 쓰는 곳 | 없으면 |
|------|---------|--------|
| `TMDB_API_KEY` | 영화 도구 (v3 API 키) | 빌드에 심긴 자격 증명을 씀. 그것도 없으면 `Error: ...` |
| `TMDB_ACCESS_TOKEN` | 영화 도구 (읽기 액세스 토큰) | 위와 같음. `TMDB_API_KEY`와 둘 중 하나면 됨 |
| `WHITE_FN` | MCP 서버 | 모든 도구를 노출 |
| `BLACK_FN` | MCP 서버 | 제외하는 도구 없음 |

## Skill Installation

CLI를 에이전트의 스킬로 등록합니다.

```sh
npx skills add https://github.com/jl917/mcp-kit/tree/main/skills
```

`skills/` 아래의 `SKILL.md`가 그대로 등록됩니다. 릴리스마다 GitHub Release 에셋으로도
올라갑니다.

## License

ISC
