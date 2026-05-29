# @julong/mono-rele2-utils

Use this skill to invoke text utility functions via the mono-rele2-utils CLI. Handles class name merging, case conversion, and text truncation.

## MCP Server

### Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "@julong/mono-rele2-utils": {
      "command": "npx",
      "args": ["-y", "@julong/mono-rele2-utils"],
      "env": {
        "API_KEY": "<value>"
      }
    }
  }
}
```

### Run

```sh
npx -y @julong/mono-rele2-utils
```

## CLI

### Installation

```sh
npm install -g @julong/mono-rele2-utils
# or
npx mono-rele2-utils-cli <toolName> [...args]
```

### Usage

```sh
mono-rele2-utils-cli <toolName> [...args]
```

Run without arguments to list all available tools:

```sh
mono-rele2-utils-cli
```

## Tools API Reference

### `cn(classes)`

**Signature**

```typescript
function cn(classes: string[]): string;
```

Merges class names, filtering out falsy values.

**Parameters**

| Name      | Type       | Description                  |
| --------- | ---------- | ---------------------------- |
| `classes` | `string[]` | List of class names to merge |

**Returns**

`string` — Merged class name string with falsy values filtered out

**CLI**

```sh
mono-rele2-utils-cli cnTool <classes>
```

**Examples**

```sh
mono-rele2-utils-cli cnTool '["btn","active","large"]'
# → btn active large
```

### `case_convert(input, to)`

**Signature**

```typescript
function case_convert(
  input: string,
  to: 'upper' | 'lower' | 'capitalize' | 'camel' | 'snake' | 'kebab',
): string;
```

Converts text to the specified case format.

**Parameters**

| Name    | Type     | Description     |
| ------- | -------- | --------------- | ------------ | ------- | ------- | -------- | ------------------ |
| `input` | `string` | Text to convert |
| `to`    | `"upper" | "lower"         | "capitalize" | "camel" | "snake" | "kebab"` | Target case format |

**Returns**

`string` — Converted text in the target case format

**CLI**

```sh
mono-rele2-utils-cli caseConvertTool <input> <to>
```

**Examples**

```sh
mono-rele2-utils-cli caseConvertTool "hello world" camel
# → helloWorld
```

```sh
mono-rele2-utils-cli caseConvertTool "helloWorld" snake
# → hello_world
```

```sh
mono-rele2-utils-cli caseConvertTool "hello world" kebab
# → hello-world
```

### `truncate(input, maxLength, suffix)`

**Signature**

```typescript
function truncate(input: string, maxLength: number, suffix?: string): string;
```

Truncates text to a maximum length and appends a suffix.

**Parameters**

| Name        | Type     | Description                                      |
| ----------- | -------- | ------------------------------------------------ |
| `input`     | `string` | Text to truncate                                 |
| `maxLength` | `number` | Maximum character length                         |
| `suffix`    | `string` | Suffix to append when truncated (default: `...`) |

**Returns**

`string` — Truncated text with the configured suffix appended if truncated

**CLI**

```sh
mono-rele2-utils-cli truncateTool <input> <maxLength> [suffix]
```

**Examples**

```sh
mono-rele2-utils-cli truncateTool "hello world long text" 10
# → hello w...
```

```sh
mono-rele2-utils-cli truncateTool "hello world" 8 "…"
# → hello w…
```

### `object_flatten(json)`

**Signature**

```typescript
function object_flatten(json: string \| JSON object): JsonObject
```

Flattens a nested JSON object of any depth into dot-notation key-value pairs. Accepts a JSON string and recursively flattens all levels. Arrays and primitives at any level are treated as leaf values..

**Parameters**

| Name   | Type                    | Description                                               |
| ------ | ----------------------- | --------------------------------------------------------- |
| `json` | `string \| JSON object` | JSON string or parsed object to flatten (unlimited depth) |

**Returns**

`JsonObject` — Flattened object with dot-notation keys — e.g. { "a.b.c": value }

**CLI**

```sh
mono-rele2-utils-cli objectFlattenTool <json>
```

**Examples**

```sh
mono-rele2-utils-cli objectFlattenTool '{"user":{"name":"Alice","address":{"city":"Seoul","zip":"12345"}},"active":true}'
# → {
  "user.name": "Alice",
  "user.address.city": "Seoul",
  "user.address.zip": "12345",
  "active": true
}
```

```sh
mono-rele2-utils-cli objectFlattenTool '{"a":{"b":{"c":{"d":{"e":"deep"}}}}}'
# → {
  "a.b.c.d.e": "deep"
}
```

### `getUser(user)`

**Signature**

```typescript
function getUser(user: RandomUser): string;
```

RandomUser API 형식의 사용자 객체를 받아 이름과 거주 도시로 구성된 한글 문장을 반환합니다. JSON 문자열 또는 파싱된 객체를 입력받습니다..

**Parameters**

| Name   | Type         | Description                                                                           |
| ------ | ------------ | ------------------------------------------------------------------------------------- |
| `user` | `RandomUser` | RandomUser 형식의 JSON 문자열 또는 객체 — name.first / name.last / location.city 필수 |

**Returns**

`string` — "이름은 {first} {last} 이고 현재 {city} 에 살고 있습니다." 형식의 한글 문장

**CLI**

```sh
mono-rele2-utils-cli getUserTool <user>
```

**`user`** type definition

```typescript
interface RandomUser {
  gender: 'male' | 'female';
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

**Examples**

```sh
mono-rele2-utils-cli getUserTool '{"name":{"title":"Mr","first":"Alice","last":"Kim"},"location":{"city":"Seoul"},"gender":"female","email":"alice@example.com","nat":"KR"}'
# → 이름은 Alice Kim 이고 현재 Seoul 에 살고 있습니다.
```

### `env_get(keys)`

**Signature**

```typescript
function env_get(keys: string[]): Record<string, string>;
```

MCP 클라이언트 config의 env 필드를 통해 주입된 환경 변수 값을 조회합니다. 조회 가능한 키는 패키지에서 제공하는 환경 변수로 한정됩니다. 현재 지원: API_KEY..

**Parameters**

| Name   | Type       | Description                                   |
| ------ | ---------- | --------------------------------------------- |
| `keys` | `string[]` | 조회할 환경 변수 이름 목록 (유효 키: API_KEY) |

**Returns**

`Record<string, string>` — key: 환경 변수 이름, value: 해당 값 (설정되지 않은 변수는 결과에서 제외)

**CLI**

```sh
mono-rele2-utils-cli envGetTool <keys>
```

**`keys`** type definition

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

**Examples**

```sh
mono-rele2-utils-cli envGetTool '["API_KEY"]'
# → {
  "API_KEY": "<value>"
}
```
