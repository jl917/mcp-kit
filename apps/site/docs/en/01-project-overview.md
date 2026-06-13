# 1. Project Overview

## Core Position & Purpose

**mcp-kit** is a monorepo kit for building [Model Context Protocol (MCP)](https://modelcontextprotocol.io) servers. Each package runs as an independent MCP server, providing both CLI tools and an MCP server interface. The primary goal is to enable AI assistants (Claude, etc.) to call system utilities and text processing functions directly through the MCP protocol.

## Target Users

- **End Users**: Developers who want to connect system/text utility functions to AI assistants via MCP clients like Claude Desktop or Cursor
- **Developers**: Install MCP server packages via npm or run directly with npx
- **AI Agents**: Call tools directly through the MCP protocol

## Core Features

Each package provides three interfaces:
- **Library API**: Use via `import { tools } from "{package.name}"` in Node.js code
- **MCP Server**: Run as a stdio-based MCP server with `npx {package.name}`
- **CLI**: Call tools directly from the terminal with `npx {package.name}-cli <toolName> [args]`

## Documentation Site

The documentation site built with Rspress lives under `apps/site/`:

- **Auto-linked Package READMEs**: The `package-docs-plugin` scans `packages/*/README.md` and dynamically renders them on `/packages` pages
- **Static docs**: Markdown files under `apps/site/docs/` serve as static documentation pages
- **Auto-generated llms.txt**: The `@rspress/plugin-llms` plugin generates LLM-friendly sitemaps (llms.txt, llms-full.txt)
- **Deployment**: Hosted on Netlify (configured via `netlify.toml`)

## Future Improvements

- Package expansion: Add more domain-specific MCP server packages
- Tool expansion: Define more tools within each package

## Business Constraints & Prohibited Rules

- `packages/common` is an internal shared library — **never published to npm** (excluded via `!packages/common` in pnpm workspace)
- Each package is versioned and published **independently** via semantic-release
- `@modelcontextprotocol/sdk` and `zod` are **core external dependencies** of all packages — do not upgrade or remove arbitrarily
- MCP servers use **stdio transport only** (HTTP/SSE not yet supported)
- All tools must be written as **async handlers**
- Tool input schemas must be defined with **Zod schemas** only (no json-schema or other formats)
