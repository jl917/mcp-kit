---
name: mono-rele2-core-cli
description: Use this skill to invoke core system utility functions via the mono-rele2-core CLI. Handles message echo, UTC timestamp generation, and environment variable lookup.
---

# mono-rele2-core-cli

```sh
mono-rele2-core-cli <toolName> [...args]
```

## Skills

### echoTool

Returns the message as-is

| arg | description |
|-----|-------------|
| `message` | Message to echo |

### timestampTool

Returns the current UTC timestamp

| arg | description |
|-----|-------------|
| `format` | Timestamp format — `iso` \| `unix` — default: `iso` |

### envTool

Returns the value of an environment variable

| arg | description |
|-----|-------------|
| `key` | Environment variable name |

### uuidTool

Generates a random UUID v4

| arg | description |
|-----|-------------|


## Examples

- `mono-rele2-core-cli echoTool "hello world"` => `hello world`
- `mono-rele2-core-cli timestampTool` => `2026-05-02T00:00:00.000Z`
- `mono-rele2-core-cli timestampTool unix` => `1746144000000`
- `mono-rele2-core-cli envTool HOME` => `/Users/julong`
- `mono-rele2-core-cli envTool NODE_ENV` => `development`
- `mono-rele2-core-cli uuidTool` => `550e8400-e29b-41d4-a716-446655440000`

## Guidelines

- Arguments are positional — pass them in the order listed in each skill's table
- Optional args with defaults may be omitted
- `envTool` returns an empty string when the variable is not set
- Run `mono-rele2-core-cli` with no args to list all available skills
