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
| `json` | string | JSON string of a nested object to flatten (unlimited depth) |

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

## MCP Server

```sh
npx -y @julong/mono-rele2-utils
```
