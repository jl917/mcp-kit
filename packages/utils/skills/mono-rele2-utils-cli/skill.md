---
name: mono-rele2-utils-cli
description: Use when the user needs text or object utilities, or to parse user data — covers: class name merging, case conversion (camel/snake/kebab/upper/lower/capitalize), text truncation, object flattening, environment variable lookup, and extracting name/city from RandomUser-format JSON (사용자 정보 분석). Accepts JSON strings or objects.
---

# mono-rele2-utils-cli

```sh
mono-rele2-utils-cli <toolName> [...args]
```

## Skills

### cnTool

Merges class names, filtering out falsy values

| arg | description |
|-----|-------------|
| `classes` | Type: string[] — List of class names to merge |

### caseConvertTool

Converts text to the specified case format

| arg | description |
|-----|-------------|
| `input` | Type: string — Text to convert |
| `to` | Type: "upper" | "lower" | "capitalize" | "camel" | "snake" | "kebab" — Target case format — `upper` \| `lower` \| `capitalize` \| `camel` \| `snake` \| `kebab` |

### truncateTool

Truncates text to a maximum length and appends a suffix

| arg | description |
|-----|-------------|
| `input` | Type: string — Text to truncate |
| `maxLength` | Type: number — Maximum character length |
| `suffix` | Type: string — Suffix to append when truncated — default: `...` |

### objectFlattenTool

Flattens a nested JSON object of any depth into dot-notation key-value pairs. Accepts a JSON string and recursively flattens all levels. Arrays and primitives at any level are treated as leaf values.

| arg | description |
|-----|-------------|
| `json` | JSON string or parsed object to flatten (unlimited depth) |

### getUserTool

RandomUser API 형식의 사용자 객체를 받아 이름과 거주 도시로 구성된 한글 문장을 반환합니다. JSON 문자열 또는 파싱된 객체를 입력받습니다.

| arg | description |
|-----|-------------|
| `user` | Type: RandomUser — RandomUser 형식의 JSON 문자열 또는 객체 — name.first / name.last / location.city 필수 |

**`user`** type definition:
```typescript
interface RandomUser {
  gender: "male" | "female";
  name: {
    title: string;
    first: string;
    last: string;
  };
  location: {
    street: {
      number: number;
      name: string;
    };
    city: string;
    state: string;
    country: string;
    postcode: string | number;
    coordinates: {
      latitude: string;
      longitude: string;
    };
    timezone: {
      offset: string;
      description: string;
    };
  };
  email: string;
  login: {
    uuid: string;
    username: string;
  };
  dob: {
    date: string;
    age: number;
  };
  phone: string;
  cell: string;
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
  nat: string;
}
```

### envGetTool

MCP 클라이언트 config의 env 필드를 통해 주입된 환경 변수 값을 조회합니다. 조회 가능한 키는 패키지에서 제공하는 환경 변수로 한정됩니다. 현재 지원: API_KEY.

| arg | description |
|-----|-------------|
| `keys` | Type: string[] — 조회할 환경 변수 이름 목록 (유효 키: API_KEY) |

**`keys`** type definition:
```typescript
// @julong/mono-rele2-utils 환경 변수 키 목록
//   "API_KEY"

// MCP client config 예시:
// {
//   "mcpServers": {
//     "@julong/mono-rele2-utils": {
//       "command": "npx",
//       "args": ["-y", "@julong/mono-rele2-utils"],
//       "env": {
//         "API_KEY": "<value>"
//       }
//     }
//   }
// }
```

## Examples

- `mono-rele2-utils-cli cnTool '["btn","active","large"]'` => `btn active large`
- `mono-rele2-utils-cli caseConvertTool "hello world" camel` => `helloWorld`
- `mono-rele2-utils-cli caseConvertTool "helloWorld" snake` => `hello_world`
- `mono-rele2-utils-cli caseConvertTool "hello world" kebab` => `hello-world`
- `mono-rele2-utils-cli truncateTool "hello world long text" 10` => `hello w...`
- `mono-rele2-utils-cli truncateTool "hello world" 8 "…"` => `hello w…`
- `mono-rele2-utils-cli objectFlattenTool '{"user":{"name":"Alice","address":{"city":"Seoul","zip":"12345"}},"active":true}'` => `{
  "user.name": "Alice",
  "user.address.city": "Seoul",
  "user.address.zip": "12345",
  "active": true
}`
- `mono-rele2-utils-cli objectFlattenTool '{"a":{"b":{"c":{"d":{"e":"deep"}}}}}'` => `{
  "a.b.c.d.e": "deep"
}`
- `mono-rele2-utils-cli getUserTool '{"name":{"title":"Mr","first":"Alice","last":"Kim"},"location":{"city":"Seoul"},"gender":"female","email":"alice@example.com","nat":"KR"}'` => `이름은 Alice Kim 이고 현재 Seoul 에 살고 있습니다.`
- `mono-rele2-utils-cli envGetTool '["API_KEY"]'` => `{
  "API_KEY": "<value>"
}`

## Guidelines

- Arguments are positional — pass them in the order listed in each skill's table
- Numeric args are auto-parsed — pass as plain numbers (e.g. `10`)
- Array args must be valid JSON — wrap in single quotes on Unix shells (e.g. `'["a","b"]'`)
- Optional args with defaults may be omitted
- Arrays and primitives at any level are always treated as leaf values — they are never traversed.
- The result is always a flat JSON object with dot-notation keys.
- There is no depth limit — objects of any nesting level are fully flattened.
- Input is accepted as a JSON string (MCP/CLI) and parsed internally.
- 입력은 RandomUser API 스펙을 따릅니다. 최소한 name.first, name.last, location.city 필드가 필요합니다.
- JSON 문자열(string)과 파싱된 객체 모두 허용됩니다 (CLI / MCP 모두 동작).
- 결과는 항상 '이름은 {first} {last} 이고 현재 {city} 에 살고 있습니다.' 형식의 한글 문장입니다.
- 조회 가능한 키: API_KEY
- MCP client config.json의 env 필드에 위 키들만 설정할 수 있습니다.
- 유효하지 않은 키를 요청하면 에러 메시지에 허용된 키 목록이 표시됩니다.
- 설정되지 않은 환경 변수는 결과 객체에서 제외됩니다.
- Run `mono-rele2-utils-cli` with no args to list all available skills
