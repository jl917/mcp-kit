# @julong/mcp-kit

Use this skill to fetch the latest KRW exchange rates for the United States, China, Japan, and the Euro area from Naver, Google, and Daum via the mcp-kit CLI. Scrapes each portal with Playwright and returns JSON, using null for any rate it cannot read.

## MCP Server

### Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "@julong/mcp-kit": {
      "command": "npx",
      "args": ["-y", "@julong/mcp-kit"]
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
