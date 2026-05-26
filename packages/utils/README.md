# @julong/mono-rele2-utils

Use this skill to invoke text utility functions via the mono-rele2-utils CLI. Handles class name merging, case conversion, and text truncation.

## CLI

### Installation

```sh
npm install -g @julong/mono-rele2-utils
# or
npx @julong/mono-rele2-utils-cli <toolName> [...args]
```

### Usage

```sh
mono-rele2-utils-cli <toolName> [...args]
```

Run without arguments to list all available tools:

```sh
mono-rele2-utils-cli
```

### Tools

#### `cnTool`

Merges class names, filtering out falsy values.

```sh
mono-rele2-utils-cli cnTool <classes>
```

| arg | type | description |
|-----|------|-------------|
| `classes` | JSON string (array) | List of class names to merge |

```sh
mono-rele2-utils-cli cnTool '["btn","active","large"]'    # btn active large
```

#### `caseConvertTool`

Converts text to the specified case format.

```sh
mono-rele2-utils-cli caseConvertTool <input> <to>
```

| arg | type | description |
|-----|------|-------------|
| `input` | string | Text to convert |
| `to` | `upper` \| `lower` \| `capitalize` \| `camel` \| `snake` \| `kebab` | Target case format |

```sh
mono-rele2-utils-cli caseConvertTool "hello world" camel    # helloWorld
mono-rele2-utils-cli caseConvertTool "helloWorld" snake     # hello_world
mono-rele2-utils-cli caseConvertTool "hello world" kebab    # hello-world
```

#### `truncateTool`

Truncates text to a maximum length and appends a suffix.

```sh
mono-rele2-utils-cli truncateTool <input> <maxLength> [suffix]
```

| arg | type | description |
|-----|------|-------------|
| `input` | string | Text to truncate |
| `maxLength` | number | Maximum character length |
| `suffix` | string | Suffix to append when truncated (default: `...`) |

```sh
mono-rele2-utils-cli truncateTool "hello world long text" 10    # hello w...
mono-rele2-utils-cli truncateTool "hello world" 8 "…"           # hello w…
```

#### `objectFlattenTool`

Flattens a nested JSON object of any depth into dot-notation key-value pairs. Accepts a JSON string and recursively flattens all levels. Arrays and primitives at any level are treated as leaf values..

```sh
mono-rele2-utils-cli objectFlattenTool <json>
```

| arg | type | description |
|-----|------|-------------|
| `json` | string \| JSON object | JSON string or parsed object to flatten (unlimited depth) |

```sh
mono-rele2-utils-cli objectFlattenTool '{"user":{"name":"Alice","address":{"city":"Seoul","zip":"12345"}},"active":true}'    # {
  "user.name": "Alice",
  "user.address.city": "Seoul",
  "user.address.zip": "12345",
  "active": true
}
mono-rele2-utils-cli objectFlattenTool '{"a":{"b":{"c":{"d":{"e":"deep"}}}}}'                                                # {
  "a.b.c.d.e": "deep"
}
```

#### `getUserTool`

RandomUser API 형식의 사용자 객체를 받아 이름과 거주 도시로 구성된 한글 문장을 반환합니다. JSON 문자열 또는 파싱된 객체를 입력받습니다..

```sh
mono-rele2-utils-cli getUserTool <user>
```

| arg | type | description |
|-----|------|-------------|
| `user` | RandomUser | RandomUser 형식의 JSON 문자열 또는 객체 — name.first / name.last / location.city 필수 |

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

```sh
mono-rele2-utils-cli getUserTool '{"name":{"title":"Mr","first":"Alice","last":"Kim"},"location":{"city":"Seoul"},"gender":"female","email":"alice@example.com","nat":"KR"}'    # 이름은 Alice Kim 이고 현재 Seoul 에 살고 있습니다.
```

## MCP Server

```sh
npx -y @julong/mono-rele2-utils
```
