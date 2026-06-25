# @julong/mono-rele2-core

Use this skill to invoke core system utility functions via the mono-rele2-core CLI. Handles message echo, UTC timestamp generation, and environment variable lookup.

## MCP Server

### Configuration

Add to your MCP client config:

```json
{
  "mcpServers": {
    "@julong/mono-rele2-core": {
      "command": "npx",
      "args": ["-y", "@julong/mono-rele2-core"]
    }
  }
}
```

### Run

```sh
npx -y @julong/mono-rele2-core
```

## CLI

### Installation

```sh
npm install -g @julong/mono-rele2-core
# or
npx mono-rele2-core-cli <toolName> [...args]
```

### Usage

```sh
mono-rele2-core-cli <toolName> [...args]
```

Run without arguments to list all available tools:

```sh
mono-rele2-core-cli
```

## Skill Installation

Install the CLI as a reusable skill for your AI agent:

```sh
npx skills add https://github.com/jl917/mcp-kit/tree/main/packages/core/skills
```

This registers all tools as callable skills in your agent's environment.

## Tools API Reference

### `echo(message)`

**Signature**

```typescript
function echo(message: string): string
```

Returns the message as-is.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `message` | `string` | Message to echo |


**Returns**

`string`


**CLI**

```sh
mono-rele2-core-cli echoTool <message>
```



**Examples**

```sh
mono-rele2-core-cli echoTool "hello world"
# → hello world
```

### `timestamp(format)`

**Signature**

```typescript
function timestamp(format?: `iso` | `unix`): string
```

Returns the current UTC timestamp.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `format` | ``iso` \| `unix`` | Timestamp format (default: `iso`) |


**Returns**

`string`


**CLI**

```sh
mono-rele2-core-cli timestampTool [format]
```



**Examples**

```sh
mono-rele2-core-cli timestampTool
# → 2026-05-02T00:00:00.000Z
```
```sh
mono-rele2-core-cli timestampTool unix
# → 1746144000000
```

### `env(key)`

**Signature**

```typescript
function env(key: string): string
```

Returns the value of an environment variable.


**Parameters**

| Name | Type | Description |
|------|------|-------------|
| `key` | `string` | Environment variable name |


**Returns**

`string`


**CLI**

```sh
mono-rele2-core-cli envTool <key>
```



**Examples**

```sh
mono-rele2-core-cli envTool HOME
# → /Users/julong
```
```sh
mono-rele2-core-cli envTool NODE_ENV
# → development
```

### `uuid()`

**Signature**

```typescript
function uuid(): string
```

Generates a random UUID v4.



**Returns**

`string`


**CLI**

```sh
mono-rele2-core-cli uuidTool
```



**Examples**

```sh
mono-rele2-core-cli uuidTool
# → 550e8400-e29b-41d4-a716-446655440000
```
