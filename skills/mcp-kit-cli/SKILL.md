---
name: mcp-kit-cli
description: Use this skill to fetch KRW exchange rates and TMDB movie listings via the mcp-kit CLI. Scrapes Naver, Google, and Daum with Playwright for USD, CNY, JPY, and EUR rates, and reads now playing, upcoming, and recommended movies from the TMDB v3 API.
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

## Examples

- `mcp-kit-cli exchangeRatesTool '["naver"]' '["USD"]'` => `{"naver":{"USD":{"currency":"USD","base":"KRW","rate":1358.7,...},"CNY":null,"JPY":null,"EUR":null},"google":null,"daum":null}`
- `mcp-kit-cli exchangeRateTool daum JPY` => `{"currency":"JPY","base":"KRW","rate":8.723,"quotedRate":872.3,"quotedUnit":100,...}`
- `mcp-kit-cli nowPlayingMoviesTool ko-KR KR` => `{"kind":"now_playing","language":"ko-KR","region":"KR","page":1,...}`
- `mcp-kit-cli upcomingMoviesTool ko-KR KR` => `{"kind":"upcoming","language":"ko-KR","region":"KR","page":1,...}`
- `mcp-kit-cli movieRecommendationsTool "인터스텔라"` => `{"kind":"similar","basedOn":{"id":157336,"title":"인터스텔라"},...}`
- `mcp-kit-cli movieRecommendationsTool null null "액션"` => `{"kind":"discover","basedOn":null,"page":1,...}`

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
- TMDB_API_KEY(v3 API 키) 또는 TMDB_ACCESS_TOKEN(읽기 액세스 토큰) 중 하나를 환경 변수로 넣어야 합니다.
- 기본값은 language=ko-KR, region=KR입니다. 한국 개봉 기준이 아니면 region을 바꾸고, 지역을 빼려면 빈 문자열을 넘깁니다.
- 한 페이지는 최대 20편입니다. 더 필요하면 page를 올려 다시 호출합니다.
- genres는 TMDB 장르 목록을 언어별로 한 번 받아 이름으로 바꾼 값이고, 장르 목록을 받지 못하면 빈 배열입니다.
- dates는 상영 중·개봉 예정 목록에만 있고 나머지는 null입니다.
- 인증 실패·조회 실패는 예외 대신 "Error: ..." 한 줄로 돌아옵니다.
- title과 movieId를 모두 비우면 기준 없이 이미 개봉한 인기작을 돌려줍니다.
- genre는 기준 영화가 없을 때만 적용됩니다. 기준 영화를 주면 TMDB 추천 목록을 그대로 씁니다.
- Run `mcp-kit-cli` with no args to list all available skills
