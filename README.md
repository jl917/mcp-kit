# @julong/mcp-kit

Use this skill to fetch KRW exchange rates, TMDB movie listings, and local system metrics via the mcp-kit CLI. Scrapes Naver, Google, and Daum with Playwright for USD, CNY, JPY, and EUR rates, reads now playing, upcoming, and recommended movies from the TMDB v3 API, and reports battery, memory, CPU, and disk usage of the machine it runs on.

## MCP Server

### Configuration

Add to your MCP client config:

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

## CLI

### Installation

```sh
npm install -g @julong/mcp-kit
# or
npx mcp-kit-cli <toolName> [...args]
```

### Usage

```sh
mcp-kit-cli <toolName> [...args]
```

Run without arguments to list all available tools:

```sh
mcp-kit-cli
```

## Skill Installation

Install the CLI as a reusable skill for your AI agent:

```sh
npx skills add https://github.com/jl917/mcp-kit/tree/main/skills
```

This registers all tools as callable skills in your agent's environment.

## Tools API Reference

### `exchange_rates(providers, currencies, timeoutMs)`

**Signature**

```typescript
function exchange_rates(providers?: ("naver" | "google" | "daum")[], currencies?: ("USD" | "CNY" | "JPY" | "EUR")[], timeoutMs?: number): Record<"naver" | "google" | "daum", Record<"USD" | "CNY" | "JPY" | "EUR", ExchangeQuote | null> | null>
```

네이버·구글·다음에서 미국(USD)·중국(CNY)·일본(JPY)·유로(EUR)의 원화 환율을 가져와 JSON으로 반환합니다. 통화 하나의 시세는 { currency, base: "KRW", rate, quotedRate, quotedUnit, raw, provider, url, fetchedAt } 형태이고, rate는 1 통화 단위당 원화로 정규화된 값입니다. 읽지 못한 통화는 null, 포털 자체를 열지 못하면 그 포털 전체가 null입니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `providers` | `("naver" \| "google" \| "daum")[]` | 조회할 포털 목록 (default: `naver,google,daum`) |
| `currencies` | `("USD" \| "CNY" \| "JPY" \| "EUR")[]` | 조회할 통화 목록 (default: `USD,CNY,JPY,EUR`) |
| `timeoutMs` | `number` | 페이지 이동·요소 대기 하나에 허용할 시간(ms) (default: `20000`) |


**Returns**

`Record<"naver" | "google" | "daum", Record<"USD" | "CNY" | "JPY" | "EUR", ExchangeQuote | null> | null>` — 포털별·통화별 시세 JSON. 통화를 읽지 못하면 그 통화가 null, 포털을 열지 못하면 포털 전체가 null


**CLI**

```sh
mcp-kit-cli exchangeRatesTool [providers] [currencies] [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli exchangeRatesTool '["naver"]' '["USD"]'
# → {"naver":{"USD":{"currency":"USD","base":"KRW","rate":1358.7,...},"CNY":null,"JPY":null,"EUR":null},"google":null,"daum":null}
```

### `exchange_rate(provider, currency, timeoutMs)`

**Signature**

```typescript
function exchange_rate(provider: "naver" | "google" | "daum", currency: "USD" | "CNY" | "JPY" | "EUR", timeoutMs?: number): ExchangeQuote | null
```

포털 한 곳에서 통화 하나의 원화 환율을 가져옵니다. 통화 하나의 시세는 { currency, base: "KRW", rate, quotedRate, quotedUnit, raw, provider, url, fetchedAt } 형태이고, rate는 1 통화 단위당 원화로 정규화된 값입니다. 읽지 못하면 null을 반환합니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `provider` | `"naver" \| "google" \| "daum"` | 조회할 포털 |
| `currency` | `"USD" \| "CNY" \| "JPY" \| "EUR"` | 조회할 통화 |
| `timeoutMs` | `number` | 페이지 이동·요소 대기 하나에 허용할 시간(ms) (default: `20000`) |


**Returns**

`ExchangeQuote | null` — 해당 통화의 시세 JSON. 읽지 못했으면 null


**CLI**

```sh
mcp-kit-cli exchangeRateTool <provider> <currency> [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli exchangeRateTool daum JPY
# → {"currency":"JPY","base":"KRW","rate":8.723,"quotedRate":872.3,"quotedUnit":100,...}
```

### `movies_now_playing(language, region, page, timeoutMs)`

**Signature**

```typescript
function movies_now_playing(language?: string, region?: string, page?: number, timeoutMs?: number): { kind, language, region, page, totalPages, totalResults, dates, basedOn, results: MovieSummary[] }
```

TMDB에서 현재 상영 중인 영화 목록을 가져와 JSON으로 반환합니다. 영화 하나는 { id, title, originalTitle, releaseDate, overview, genres, voteAverage, voteCount, popularity, posterUrl, tmdbUrl } 형태입니다. dates에 집계 기간이 함께 담깁니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `language` | `string` | 응답 언어 (ISO 639-1 + ISO 3166-1, 예: ko-KR) (default: `ko-KR`) |
| `region` | `string` | 개봉 기준 지역 (ISO 3166-1, 예: KR). 빈 문자열이면 지역을 지정하지 않음 (default: `KR`) |
| `page` | `number` | 조회할 페이지 번호 (default: `1`) |
| `timeoutMs` | `number` | 요청 하나에 허용할 시간(ms) (default: `10000`) |


**Returns**

`{ kind, language, region, page, totalPages, totalResults, dates, basedOn, results: MovieSummary[] }` — 상영 중인 영화 목록 JSON. basedOn은 항상 null


**CLI**

```sh
mcp-kit-cli nowPlayingMoviesTool [language] [region] [page] [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli nowPlayingMoviesTool ko-KR KR
# → {"kind":"now_playing","language":"ko-KR","region":"KR","page":1,...}
```

### `movies_upcoming(language, region, page, timeoutMs)`

**Signature**

```typescript
function movies_upcoming(language?: string, region?: string, page?: number, timeoutMs?: number): { kind, language, region, page, totalPages, totalResults, dates, basedOn, results: MovieSummary[] }
```

TMDB에서 개봉 예정 영화 목록을 가져와 JSON으로 반환합니다. 영화 하나는 { id, title, originalTitle, releaseDate, overview, genres, voteAverage, voteCount, popularity, posterUrl, tmdbUrl } 형태입니다. dates에 집계 기간이 함께 담깁니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `language` | `string` | 응답 언어 (ISO 639-1 + ISO 3166-1, 예: ko-KR) (default: `ko-KR`) |
| `region` | `string` | 개봉 기준 지역 (ISO 3166-1, 예: KR). 빈 문자열이면 지역을 지정하지 않음 (default: `KR`) |
| `page` | `number` | 조회할 페이지 번호 (default: `1`) |
| `timeoutMs` | `number` | 요청 하나에 허용할 시간(ms) (default: `10000`) |


**Returns**

`{ kind, language, region, page, totalPages, totalResults, dates, basedOn, results: MovieSummary[] }` — 개봉 예정 영화 목록 JSON. basedOn은 항상 null


**CLI**

```sh
mcp-kit-cli upcomingMoviesTool [language] [region] [page] [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli upcomingMoviesTool ko-KR KR
# → {"kind":"upcoming","language":"ko-KR","region":"KR","page":1,...}
```

### `movie_recommendations(title, movieId, genre, language, region, page, timeoutMs)`

**Signature**

```typescript
function movie_recommendations(title?: string, movieId?: number, genre?: string, language?: string, region?: string, page?: number, timeoutMs?: number): { kind, language, region, page, totalPages, totalResults, dates, basedOn, results: MovieSummary[] }
```

TMDB에서 추천 영화 목록을 가져와 JSON으로 반환합니다. 기준 영화를 주면 그 영화 기반 추천(kind: "similar")을, 주지 않으면 이미 개봉한 인기작(kind: "discover")을 돌려줍니다. 영화 하나는 { id, title, originalTitle, releaseDate, overview, genres, voteAverage, voteCount, popularity, posterUrl, tmdbUrl } 형태입니다..


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `title` | `string` | 기준 영화 제목. 검색해서 첫 결과를 기준으로 삼음 (optional) |
| `movieId` | `number` | 기준 영화의 TMDB id. title보다 우선함 (optional) |
| `genre` | `string` | 기준 영화 없이 추천할 때만 적용할 장르 이름 또는 id (예: 액션, 28) (optional) |
| `language` | `string` | 응답 언어 (ISO 639-1 + ISO 3166-1, 예: ko-KR) (default: `ko-KR`) |
| `region` | `string` | 개봉 기준 지역 (ISO 3166-1, 예: KR). 빈 문자열이면 지역을 지정하지 않음 (default: `KR`) |
| `page` | `number` | 조회할 페이지 번호 (default: `1`) |
| `timeoutMs` | `number` | 요청 하나에 허용할 시간(ms) (default: `10000`) |


**Returns**

`{ kind, language, region, page, totalPages, totalResults, dates, basedOn, results: MovieSummary[] }` — 추천 영화 목록 JSON. similar 추천이면 basedOn에 기준 영화의 { id, title }이 담김


**CLI**

```sh
mcp-kit-cli movieRecommendationsTool [title] [movieId] [genre] [language] [region] [page] [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli movieRecommendationsTool "인터스텔라"
# → {"kind":"similar","basedOn":{"id":157336,"title":"인터스텔라"},...}
```
```sh
mcp-kit-cli movieRecommendationsTool null null "액션"
# → {"kind":"discover","basedOn":null,"page":1,...}
```

### `system_battery(timeoutMs)`

**Signature**

```typescript
function system_battery(timeoutMs?: number): BatteryInfo | null
```

배터리 잔량과 전원 상태를 JSON으로 반환합니다. { percent, isCharging, powerSource, timeRemainingMin, cycleCount, healthPercent, type, model } 형태이고, 배터리가 없는 기계면 null입니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `timeoutMs` | `number` | 항목 하나를 읽는 데 허용할 시간(ms) (default: `5000`) |


**Returns**

`BatteryInfo | null` — 배터리 상태 JSON. 배터리가 없으면 null


**CLI**

```sh
mcp-kit-cli systemBatteryTool [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli systemBatteryTool
# → {"percent":100,"isCharging":false,"powerSource":"battery","timeRemainingMin":555,...}
```

### `system_memory(timeoutMs)`

**Signature**

```typescript
function system_memory(timeoutMs?: number): MemoryInfo
```

물리 메모리와 스왑 사용량을 JSON으로 반환합니다. { totalBytes, usedBytes, availableBytes, usedPercent, cachedBytes, swap } 형태이고, usedBytes는 캐시를 뺀 실제 사용량입니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `timeoutMs` | `number` | 항목 하나를 읽는 데 허용할 시간(ms) (default: `5000`) |


**Returns**

`MemoryInfo` — 메모리 사용량 JSON. 스왑을 쓰지 않으면 swap은 null


**CLI**

```sh
mcp-kit-cli systemMemoryTool [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli systemMemoryTool
# → {"totalBytes":34359738368,"usedBytes":24105795584,"usedPercent":70.2,...}
```

### `system_cpu(sampleMs, timeoutMs)`

**Signature**

```typescript
function system_cpu(sampleMs?: number, timeoutMs?: number): CpuLoadInfo
```

표본 구간 동안의 CPU 사용률을 JSON으로 반환합니다. { usagePercent, userPercent, systemPercent, cores, perCorePercent, loadAveragePerCore, sampleMs } 형태이고, 코어별 사용률이 perCorePercent에 담깁니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `sampleMs` | `number` | CPU 사용률을 재는 표본 구간(ms). 200ms 미만은 받지 않음 (default: `300`) |
| `timeoutMs` | `number` | 항목 하나를 읽는 데 허용할 시간(ms) (default: `5000`) |


**Returns**

`CpuLoadInfo` — CPU 사용률 JSON. 실제로 잰 표본 구간은 sampleMs


**CLI**

```sh
mcp-kit-cli systemCpuTool [sampleMs] [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli systemCpuTool 500
# → {"usagePercent":28.5,"userPercent":18.9,"cores":10,"sampleMs":500,...}
```

### `system_disk(allDisks, timeoutMs)`

**Signature**

```typescript
function system_disk(allDisks?: boolean, timeoutMs?: number): DiskUsage[]
```

파일 시스템 용량을 JSON 배열로 반환합니다. 항목 하나는 { mount, fs, type, totalBytes, usedBytes, availableBytes, usedPercent } 형태이고, 기본은 용량 질문에 답하는 볼륨 하나입니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `allDisks` | `boolean` | true면 마운트된 파일 시스템 전부, false면 기본 디스크 하나만 (default: `false`) |
| `timeoutMs` | `number` | 항목 하나를 읽는 데 허용할 시간(ms) (default: `5000`) |


**Returns**

`DiskUsage[]` — 파일 시스템별 용량 JSON 배열. 읽을 볼륨이 없으면 빈 배열


**CLI**

```sh
mcp-kit-cli systemDiskTool [allDisks] [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli systemDiskTool
# → [{"mount":"/System/Volumes/Data","totalBytes":994662584320,"availableBytes":442990383104,"usedPercent":53.8,...}]
```
```sh
mcp-kit-cli systemDiskTool true
# → [{"mount":"/",...},{"mount":"/Volumes/Backup",...}]
```

### `system_info(sections, sampleMs, allDisks, timeoutMs)`

**Signature**

```typescript
function system_info(sections?: ("battery" | "memory" | "cpu" | "disk")[], sampleMs?: number, allDisks?: boolean, timeoutMs?: number): { collectedAt: string, battery?: BatteryInfo | null, memory?: MemoryInfo | null, cpu?: CpuLoadInfo | null, disks?: DiskUsage[] | null, errors?: Record<string, string> }
```

배터리·메모리·CPU·디스크 가운데 요청한 항목을 한 번에 읽어 JSON으로 반환합니다. { collectedAt, battery, memory, cpu, disks, errors } 형태이고, 요청하지 않은 항목은 필드째 빠집니다.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `sections` | `("battery" \| "memory" \| "cpu" \| "disk")[]` | 읽을 항목 목록 (default: `battery,memory,cpu,disk`) |
| `sampleMs` | `number` | CPU 사용률을 재는 표본 구간(ms). 200ms 미만은 받지 않음 (default: `300`) |
| `allDisks` | `boolean` | true면 마운트된 파일 시스템 전부, false면 기본 디스크 하나만 (default: `false`) |
| `timeoutMs` | `number` | 항목 하나를 읽는 데 허용할 시간(ms) (default: `5000`) |


**Returns**

`{ collectedAt: string, battery?: BatteryInfo | null, memory?: MemoryInfo | null, cpu?: CpuLoadInfo | null, disks?: DiskUsage[] | null, errors?: Record<string, string> }` — 요청한 항목만 담긴 JSON. 읽지 못한 항목은 null이고 이유가 errors에 담김


**CLI**

```sh
mcp-kit-cli systemInfoTool [sections] [sampleMs] [allDisks] [timeoutMs]
```



**Examples**

```sh
mcp-kit-cli systemInfoTool '["cpu","memory"]'
# → {"collectedAt":"2026-09-25T01:15:00.000Z","memory":{...},"cpu":{...}}
```
```sh
mcp-kit-cli systemInfoTool '["battery"]'
# → {"collectedAt":"2026-09-25T01:15:00.000Z","battery":{"percent":100,...}}
```
