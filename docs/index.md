---
pageType: home
hero:
  name: MCP-Kit
  text: Start an MCP Server with a Single Command
  tagline: A KRW exchange rate MCP server that AI assistants can use immediately via npx
  actions:
    - theme: brand
      text: Project Overview
      link: /en/01-project-overview
    - theme: alt
      text: GitHub
      link: https://github.com/jl917/mcp-kit
features:
  - title: AI Agent Ready
    details: Runs as an MCP (Model Context Protocol) server, allowing AI assistants (Claude, etc.) to call tools directly. Instantly executable via npx.
  - title: npx-based Deployment
    details: Build and publish to npm — then any AI Agent can use it with a single `npx -y @julong/mcp-kit` command. No installation or configuration required.
  - title: Single Repository
    details: One pnpm repository, one published package. Source lives under `src/`, with the shared kit in `src/common` and the scraping domain in `src/exchange`.
  - title: Fast Development Experience
    details: Bun runs TypeScript directly for auto-generating README docs. Rslint + Prettier maintain code quality, and Rstest handles testing.
---
