---
name: mcp-kit-cli
description: Use this skill to fetch the latest KRW exchange rates for the United States, China, Japan, and the Euro area from Naver, Google, and Daum via the mcp-kit CLI. Scrapes each portal with Playwright and returns JSON, using null for any rate it cannot read.
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

## Examples

- `mcp-kit-cli exchangeRatesTool '["naver"]' '["USD"]'` => `{"naver":{"USD":{"currency":"USD","base":"KRW","rate":1358.7,...},"CNY":null,"JPY":null,"EUR":null},"google":null,"daum":null}`
- `mcp-kit-cli exchangeRateTool daum JPY` => `{"currency":"JPY","base":"KRW","rate":8.723,"quotedRate":872.3,"quotedUnit":100,...}`

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
- Run `mcp-kit-cli` with no args to list all available skills
