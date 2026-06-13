---
pageType: home
hero:
  name: MCP-Kit
  text: Start MCP Servers with a Single Command
  tagline: A monorepo kit for building and deploying MCP servers that AI assistants can use immediately via npx
  actions:
    - theme: brand
      text: Project Overview
      link: /en/01-project-overview
    - theme: alt
      text: GitHub
      link: https://github.com/jl917/mcp-kit
features:
  - title: AI Agent Ready
    details: Each package runs as an MCP (Model Context Protocol) server, allowing AI assistants (Claude, etc.) to call tools directly. Instantly executable via npx.
  - title: npx-based Deployment
    details: Build and publish to npm — then any AI Agent can use it with a single `npx -y @julong/mono-rele2-utils` command. No installation or configuration required.
  - title: Monorepo
    details: A pnpm + Turborepo monorepo managing multiple MCP servers in one repository. Shared kit (@common) minimizes duplication.
  - title: Fast Development Experience
    details: Bun runs TypeScript directly for auto-generating README docs. Rslint + Prettier maintain code quality, and Rstest handles testing.
---
