---
name: mcp-kit-cli
description: Use this skill to fetch KRW exchange rates, TMDB movie listings, and local system metrics via the mcp-kit CLI. Scrapes Naver, Google, and Daum with Playwright for USD, CNY, JPY, and EUR rates, reads now playing, upcoming, and recommended movies from the TMDB v3 API, and reports battery, memory, CPU, and disk usage of the machine it runs on.
---

# mcp-kit-cli

```sh
mcp-kit-cli <toolName> [...args]
```

## Skills

### exchangeRatesTool

네이버·구글·다음에서 미국(USD)·중국(CNY)·일본(JPY)·유로(EUR)의 원화 환율을 가져와 JSON으로 반환합니다. 통화 하나의 시세는 { currency, base: "KRW", rate, quotedRate, quotedUnit, raw, provider, url, fetchedAt } 형태이고, rate는 1 통화 단위당 원화로 정규화된 값입니다. 읽지 못한 통화는 null, 포털 자체를 열지 못하면 그 포털 전체가 null입니다

| arg | description |
|-----|-------------|
| `providers` | Type: ("naver" \| "google" \| "daum")[] — 조회할 포털 목록 — default: `naver,google,daum` |
| `currencies` | Type: ("USD" \| "CNY" \| "JPY" \| "EUR")[] — 조회할 통화 목록 — default: `USD,CNY,JPY,EUR` |
| `timeoutMs` | Type: number — 페이지 이동·요소 대기 하나에 허용할 시간(ms) — default: `20000` |

### exchangeRateTool

포털 한 곳에서 통화 하나의 원화 환율을 가져옵니다. 통화 하나의 시세는 { currency, base: "KRW", rate, quotedRate, quotedUnit, raw, provider, url, fetchedAt } 형태이고, rate는 1 통화 단위당 원화로 정규화된 값입니다. 읽지 못하면 null을 반환합니다

| arg | description |
|-----|-------------|
| `provider` | Type: "naver" \| "google" \| "daum" — 조회할 포털 — `naver` \| `google` \| `daum` |
| `currency` | Type: "USD" \| "CNY" \| "JPY" \| "EUR" — 조회할 통화 — `USD` \| `CNY` \| `JPY` \| `EUR` |
| `timeoutMs` | Type: number — 페이지 이동·요소 대기 하나에 허용할 시간(ms) — default: `20000` |

### nowPlayingMoviesTool

TMDB에서 현재 상영 중인 영화 목록을 가져와 JSON으로 반환합니다. 영화 하나는 { id, title, originalTitle, releaseDate, overview, genres, voteAverage, voteCount, popularity, posterUrl, tmdbUrl } 형태입니다. dates에 집계 기간이 함께 담깁니다

| arg | description |
|-----|-------------|
| `language` | Type: string — 응답 언어 (ISO 639-1 + ISO 3166-1, 예: ko-KR) — default: `ko-KR` |
| `region` | Type: string — 개봉 기준 지역 (ISO 3166-1, 예: KR). 빈 문자열이면 지역을 지정하지 않음 — default: `KR` |
| `page` | Type: number — 조회할 페이지 번호 — default: `1` |
| `timeoutMs` | Type: number — 요청 하나에 허용할 시간(ms) — default: `10000` |

### upcomingMoviesTool

TMDB에서 개봉 예정 영화 목록을 가져와 JSON으로 반환합니다. 영화 하나는 { id, title, originalTitle, releaseDate, overview, genres, voteAverage, voteCount, popularity, posterUrl, tmdbUrl } 형태입니다. dates에 집계 기간이 함께 담깁니다

| arg | description |
|-----|-------------|
| `language` | Type: string — 응답 언어 (ISO 639-1 + ISO 3166-1, 예: ko-KR) — default: `ko-KR` |
| `region` | Type: string — 개봉 기준 지역 (ISO 3166-1, 예: KR). 빈 문자열이면 지역을 지정하지 않음 — default: `KR` |
| `page` | Type: number — 조회할 페이지 번호 — default: `1` |
| `timeoutMs` | Type: number — 요청 하나에 허용할 시간(ms) — default: `10000` |

### movieRecommendationsTool

TMDB에서 추천 영화 목록을 가져와 JSON으로 반환합니다. 기준 영화를 주면 그 영화 기반 추천(kind: "similar")을, 주지 않으면 이미 개봉한 인기작(kind: "discover")을 돌려줍니다. 영화 하나는 { id, title, originalTitle, releaseDate, overview, genres, voteAverage, voteCount, popularity, posterUrl, tmdbUrl } 형태입니다.

| arg | description |
|-----|-------------|
| `title` | Type: string — 기준 영화 제목. 검색해서 첫 결과를 기준으로 삼음 — optional |
| `movieId` | Type: number — 기준 영화의 TMDB id. title보다 우선함 — optional |
| `genre` | Type: string — 기준 영화 없이 추천할 때만 적용할 장르 이름 또는 id (예: 액션, 28) — optional |
| `language` | Type: string — 응답 언어 (ISO 639-1 + ISO 3166-1, 예: ko-KR) — default: `ko-KR` |
| `region` | Type: string — 개봉 기준 지역 (ISO 3166-1, 예: KR). 빈 문자열이면 지역을 지정하지 않음 — default: `KR` |
| `page` | Type: number — 조회할 페이지 번호 — default: `1` |
| `timeoutMs` | Type: number — 요청 하나에 허용할 시간(ms) — default: `10000` |

### systemBatteryTool

배터리 잔량과 전원 상태를 JSON으로 반환합니다. { percent, isCharging, powerSource, timeRemainingMin, cycleCount, healthPercent, type, model } 형태이고, 배터리가 없는 기계면 null입니다

| arg | description |
|-----|-------------|
| `timeoutMs` | Type: number — 항목 하나를 읽는 데 허용할 시간(ms) — default: `5000` |

### systemMemoryTool

물리 메모리와 스왑 사용량을 JSON으로 반환합니다. { totalBytes, usedBytes, availableBytes, usedPercent, cachedBytes, swap } 형태이고, usedBytes는 캐시를 뺀 실제 사용량입니다

| arg | description |
|-----|-------------|
| `timeoutMs` | Type: number — 항목 하나를 읽는 데 허용할 시간(ms) — default: `5000` |

### systemCpuTool

표본 구간 동안의 CPU 사용률을 JSON으로 반환합니다. { usagePercent, userPercent, systemPercent, cores, perCorePercent, loadAveragePerCore, sampleMs } 형태이고, 코어별 사용률이 perCorePercent에 담깁니다

| arg | description |
|-----|-------------|
| `sampleMs` | Type: number — CPU 사용률을 재는 표본 구간(ms). 200ms 미만은 받지 않음 — default: `300` |
| `timeoutMs` | Type: number — 항목 하나를 읽는 데 허용할 시간(ms) — default: `5000` |

### systemDiskTool

파일 시스템 용량을 JSON 배열로 반환합니다. 항목 하나는 { mount, fs, type, totalBytes, usedBytes, availableBytes, usedPercent } 형태이고, 기본은 용량 질문에 답하는 볼륨 하나입니다

| arg | description |
|-----|-------------|
| `allDisks` | Type: boolean — true면 마운트된 파일 시스템 전부, false면 기본 디스크 하나만 — default: `false` |
| `timeoutMs` | Type: number — 항목 하나를 읽는 데 허용할 시간(ms) — default: `5000` |

### systemInfoTool

배터리·메모리·CPU·디스크 가운데 요청한 항목을 한 번에 읽어 JSON으로 반환합니다. { collectedAt, battery, memory, cpu, disks, errors } 형태이고, 요청하지 않은 항목은 필드째 빠집니다

| arg | description |
|-----|-------------|
| `sections` | Type: ("battery" \| "memory" \| "cpu" \| "disk")[] — 읽을 항목 목록 — default: `battery,memory,cpu,disk` |
| `sampleMs` | Type: number — CPU 사용률을 재는 표본 구간(ms). 200ms 미만은 받지 않음 — default: `300` |
| `allDisks` | Type: boolean — true면 마운트된 파일 시스템 전부, false면 기본 디스크 하나만 — default: `false` |
| `timeoutMs` | Type: number — 항목 하나를 읽는 데 허용할 시간(ms) — default: `5000` |

## Examples

- `mcp-kit-cli exchangeRatesTool '["naver"]' '["USD"]'` => `{"naver":{"USD":{"currency":"USD","base":"KRW","rate":1358.7,...},"CNY":null,"JPY":null,"EUR":null},"google":null,"daum":null}`
- `mcp-kit-cli exchangeRateTool daum JPY` => `{"currency":"JPY","base":"KRW","rate":8.723,"quotedRate":872.3,"quotedUnit":100,...}`
- `mcp-kit-cli nowPlayingMoviesTool ko-KR KR` => `{"kind":"now_playing","language":"ko-KR","region":"KR","page":1,...}`
- `mcp-kit-cli upcomingMoviesTool ko-KR KR` => `{"kind":"upcoming","language":"ko-KR","region":"KR","page":1,...}`
- `mcp-kit-cli movieRecommendationsTool "인터스텔라"` => `{"kind":"similar","basedOn":{"id":157336,"title":"인터스텔라"},...}`
- `mcp-kit-cli movieRecommendationsTool null null "액션"` => `{"kind":"discover","basedOn":null,"page":1,...}`
- `mcp-kit-cli systemBatteryTool` => `{"percent":100,"isCharging":false,"powerSource":"battery","timeRemainingMin":555,...}`
- `mcp-kit-cli systemMemoryTool` => `{"totalBytes":34359738368,"usedBytes":24105795584,"usedPercent":70.2,...}`
- `mcp-kit-cli systemCpuTool 500` => `{"usagePercent":28.5,"userPercent":18.9,"cores":10,"sampleMs":500,...}`
- `mcp-kit-cli systemDiskTool` => `[{"mount":"/System/Volumes/Data","totalBytes":994662584320,"availableBytes":442990383104,"usedPercent":53.8,...}]`
- `mcp-kit-cli systemDiskTool true` => `[{"mount":"/",...},{"mount":"/Volumes/Backup",...}]`
- `mcp-kit-cli systemInfoTool '["cpu","memory"]'` => `{"collectedAt":"2026-09-25T01:15:00.000Z","memory":{...},"cpu":{...}}`
- `mcp-kit-cli systemInfoTool '["battery"]'` => `{"collectedAt":"2026-09-25T01:15:00.000Z","battery":{"percent":100,...}}`

## Guidelines

- Arguments are positional — pass them in the order listed in each skill's table
- Numeric args are auto-parsed — pass as plain numbers (e.g. `10`)
- Array args must be valid JSON — wrap in single quotes on Unix shells (e.g. `'["a","b"]'`)
- Optional args with defaults may be omitted
- Playwright로 각 포털을 실제로 열어 읽으므로 한 번 호출에 수 초가 걸립니다.
- 처음 쓰기 전에 브라우저를 한 번 설치해야 합니다: npx playwright install chromium
- 읽지 못한 통화는 null, 포털 자체를 열지 못하면 해당 포털 전체가 null입니다.
- rate는 항상 1 통화 단위당 원화입니다. 포털이 100엔으로 고시해도 rate는 1엔 기준이고, 화면 값은 quotedRate/quotedUnit에 남습니다.
- 포털마다 고시 시각과 기준(매매기준율 / 시장환율)이 달라 값이 조금씩 다를 수 있습니다.
- 한 번 호출은 통화를 몇 개 넣든 45초 안에 끝납니다. 시간이 모자라 못 읽은 통화는 null입니다.
- TMDB_API_KEY(v3 API 키) 또는 TMDB_ACCESS_TOKEN(읽기 액세스 토큰) 중 하나가 필요합니다. 빌드에 심긴 자격 증명이 있으면 그대로 쓰고, 환경 변수를 주면 그 값이 우선입니다.
- 기본값은 language=ko-KR, region=KR입니다. 한국 개봉 기준이 아니면 region을 바꾸고, 지역을 빼려면 빈 문자열을 넘깁니다.
- 한 페이지는 최대 20편입니다. 더 필요하면 page를 올려 다시 호출합니다.
- genres는 TMDB 장르 목록을 언어별로 한 번 받아 이름으로 바꾼 값이고, 장르 목록을 받지 못하면 빈 배열입니다.
- dates는 상영 중·개봉 예정 목록에만 있고 나머지는 null입니다.
- 인증 실패·조회 실패는 예외 대신 "Error: ..." 한 줄로 돌아옵니다.
- title과 movieId를 모두 비우면 기준 없이 이미 개봉한 인기작을 돌려줍니다.
- genre는 기준 영화가 없을 때만 적용됩니다. 기준 영화를 주면 TMDB 추천 목록을 그대로 씁니다.
- 크기는 모두 바이트, 비율은 모두 퍼센트(0~100)입니다.
- 읽지 못하면 예외 대신 "Error: ..." 한 줄로 돌아옵니다.
- 항목이 하나만 필요하면 항목별 도구를, 둘 이상 필요하면 system_info에 sections를 넘겨 한 번에 받습니다.
- 배터리가 없는 기계면 null입니다.
- powerSource는 어댑터에 꽂혀 있는지, isCharging은 실제로 충전되고 있는지입니다. 완충 상태로 꽂아 두면 powerSource는 "ac", isCharging은 false입니다.
- timeRemainingMin은 배터리로 쓰는 동안만 값이 있고 충전 중에는 null입니다.
- usedBytes는 캐시·버퍼를 뺀 값이라 운영체제 도구가 보여 주는 "사용 중"보다 작습니다. 회수 가능한 몫은 cachedBytes에 있습니다.
- swap은 스왑을 쓰지 않는 환경에서 null입니다.
- usagePercent는 표본 구간(sampleMs, 기본 300ms) 동안의 평균이며 순간값이 아닙니다.
- sampleMs를 늘리면 값이 안정되는 대신 호출이 그만큼 늦어집니다.
- loadAveragePerCore는 부하 평균을 내지 않는 Windows에서 null입니다.
- 기본은 용량 질문에 답하는 볼륨 하나입니다. macOS는 사용자 데이터 볼륨(/System/Volumes/Data), 그 밖의 환경은 루트(/)를 고릅니다.
- allDisks를 주면 외장 디스크와 시스템 볼륨까지 나옵니다. macOS APFS는 볼륨 여러 개가 컨테이너 하나를 나눠 쓰므로 availableBytes가 서로 겹칩니다.
- usedPercent는 df와 같은 기준(usedBytes / (usedBytes + availableBytes))이므로 usedBytes / totalBytes와 다를 수 있습니다.
- sections에 넣은 항목만 응답에 들어갑니다. 넣지 않은 항목은 필드째 빠집니다.
- 항목은 동시에 읽습니다. 네 항목을 다 물어도 CPU 하나를 물을 때와 걸리는 시간이 비슷합니다.
- 읽지 못한 항목은 null이 되고 이유가 errors에 담깁니다. errors에 없는 null 배터리는 배터리가 없는 기계입니다.
- Run `mcp-kit-cli` with no args to list all available skills
