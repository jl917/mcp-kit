# 1. Project Overview

## Core Position & Purpose

**mcp-kit** is a single repository for building and shipping a [Model Context Protocol (MCP)](https://modelcontextprotocol.io) server. One repository maps to one published package (`@julong/mcp-kit`), providing both CLI tools and an MCP server interface. The primary goal is to enable AI assistants (Claude, etc.) to look up KRW exchange rates, TMDB movie listings, and the host machine's battery, memory, CPU, and disk usage directly through the MCP protocol.

## Target Users

- **End Users**: Developers who want to connect exchange rate, movie, and host metric lookups to AI assistants via MCP clients like Claude Desktop or Cursor
- **Developers**: Install the MCP server package via npm or run it directly with npx
- **AI Agents**: Call tools directly through the MCP protocol

## Core Features

The package provides three interfaces:
- **Library API**: Use via `import { tools } from "@julong/mcp-kit"` in Node.js code
- **MCP Server**: Run as a stdio-based MCP server with `npx @julong/mcp-kit`
- **CLI**: Call tools directly from the terminal with `npx mcp-kit-cli <toolName> [args]`

## How `npx` Runs an MCP Server (stdio transport)

When an MCP client (Claude Desktop, Cursor, etc.) starts a server via `npx @julong/mcp-kit`, the server does **not** open a network port. Instead it communicates over the process's standard streams. The flow is:

1. **Process spawn**: The client launches the command as a child process (`npx @julong/mcp-kit`). `npx` resolves the package from the npm registry (or local cache), then executes its `bin` entry — a Node.js script whose shebang (`#!/usr/bin/env node`) makes it directly runnable.

2. **Pipe wiring**: The client keeps the child process's `stdin`, `stdout`, and `stderr` connected as pipes. These three streams are the transport:
   - **`stdin`** (client → server): the client writes requests here. The server reads its incoming messages from `stdin`.
   - **`stdout`** (server → client): the server writes responses/notifications here. **This channel is reserved exclusively for protocol messages** — printing anything else to `stdout` corrupts the stream.
   - **`stderr`** (server → client, out-of-band): used for logging/diagnostics. The client may capture it, but it is never parsed as protocol data. All human-readable logs must go here, not to `stdout`.

3. **Message framing (JSON-RPC 2.0)**: MCP speaks [JSON-RPC 2.0](https://www.jsonrpc.org/specification). Each message is a single JSON object serialized on one line and terminated by a newline (`\n`) — newline-delimited JSON. A typical exchange:
   - Client → `stdin`: `{"jsonrpc":"2.0","id":1,"method":"initialize",...}`
   - Server → `stdout`: `{"jsonrpc":"2.0","id":1,"result":{...}}`
   - Then `tools/list`, `tools/call`, etc. follow the same request/response pattern.

4. **Lifecycle**: The connection lives for as long as the child process does. When the client closes `stdin` (EOF) or terminates the process, the server shuts down. There is no long-running daemon and no port to manage — the server exists only while the client holds the pipe open.

In this repo, the transport plumbing is handled by `StdioServerTransport` from `@modelcontextprotocol/sdk`, so tool authors never touch `stdin`/`stdout` directly — they just register async tool handlers, and the SDK serializes/deserializes the JSON-RPC frames over the standard streams.

> **Why stdio instead of HTTP?** It requires no port allocation, no auth layer, and no network exposure. The client fully controls the server's lifetime, and the OS pipe is a secure local channel. This is why the project uses **stdio transport only** (see Business Constraints below).

## Documentation Site

The documentation site built with Rspress lives at the repository root:

- **Auto-linked README**: The `readme-docs-plugin` renders the generated root `README.md` (produced by `pnpm readme`) on the `/api` page
- **Static docs**: Markdown files under `docs/` serve as static documentation pages
- **Auto-generated llms.txt**: The `@rspress/plugin-llms` plugin generates LLM-friendly sitemaps (llms.txt, llms-full.txt)
- **Deployment**: Hosted on Netlify (configured via `netlify.toml`)

## Future Improvements

- Tool expansion: Define more tools under `src/tools/`
- Portal/currency expansion: Add lookup targets under `src/exchange/providers/`

## Business Constraints & Prohibited Rules

- `src/common` is an internal shared module — it is inlined into the bundle at build time and **never published as a separate package**
- The single root package is versioned and published via release-please
- `@modelcontextprotocol/sdk` and `zod` are **core external dependencies** — do not upgrade or remove arbitrarily
- MCP servers use **stdio transport only** (HTTP/SSE not yet supported)
- All tools must be written as **async handlers**
- Tool input schemas must be defined with **Zod schemas** only (no json-schema or other formats)
