# 7. Testing & Quality Standards

## Current State

The test runner is **Rstest** (`@rstest/core`), configured by a single root `rstest.config.ts`. Test files live next to the file under test as `*.test.ts`.

```
src/exchange/parse.test.ts      # Parsing / quoted-unit normalization unit tests
src/tools/exchange.test.ts      # Tool handler tests
src/system/normalize.test.ts    # Host metric conversion / primary disk selection unit tests
src/system/collect.test.ts      # Section selection, concurrency, and timeouts (systeminformation mocked)
src/tools/system.test.ts        # Tool handler tests against the real machine
src/common/kit/server.test.ts   # Tool registration filters, process guards, stderr-only logging
src/common/agent/log.test.ts    # Log serialization / redaction tests
src/agent.test.ts               # Real LLM + real portals (excluded from the default run)
```

Coverage is always collected with the v8 provider and written to `coverage/` as text, html, and lcov.

## Running Tests

```bash
pnpm test            # All src/**/*.test.ts (agent tests are skipped via describe.skipIf)
pnpm test:agent      # Runs agent.test.ts with RUN_AGENT_TESTS=1
```

`pnpm test:agent` has prerequisites:

1. `pnpm build` — the agent spawns the built `dist/server.js`
2. `npx playwright install chromium` — once
3. `OPENAI_API_KEY` (or `SILICONFLOW_API_KEY`, `API_KEY`) in the repository root `.env`

## Critical Scenarios to Test

| Priority | Target | What to Test |
|----------|--------|--------------|
| 🔴 High | Each tool handler | Responses for valid input, boundary values, and error input |
| 🔴 High | Zod schema validation | Behavior of each Zod type: Optional, Default, Enum, etc. |
| 🔴 High | Exchange rate parsing | Quoted-unit normalization (e.g. per-100-JPY), comma/whitespace handling, `null` for unreadable values |
| 🟡 Medium | MCP server registration | Whether `createMcpServer()` registers all tools correctly |
| 🟡 Medium | CLI parsing | `runCli()` argument parsing (including automatic JSON parsing) |
| 🟢 Low | Doc generation | `generateReadmeApiDocs()` output format |

## Testing Rules for New Code

1. **Whenever a new tool is added**, write a unit test for its handler
2. Add validation tests when parameter Zod schemas are added/changed
3. Verify that `examples` actually work
4. Gate tests that need network or a browser behind `describe.skipIf` so the default run stays fast

## Quality Verification

### Lint

```bash
pnpm lint            # rslint --config rslint.config.ts src scripts
```

- Uses the `@rslint/core` ts / js / import / unicorn recommended configs
- `@typescript-eslint/no-explicit-any` is off (MCP SDK interface compatibility)

### Formatting

```bash
pnpm format          # prettier --write
pnpm format:check    # run in CI
```

### Type Checking

```bash
pnpm typecheck       # tsc --noEmit
```

- Root `tsconfig.json` sets `"noEmit": true` and `strict: true`
- `include: ["src"]` — both sources and test files are checked

### Build Verification

```bash
pnpm build           # tsup
```

- Verifies tsup bundles all 3 entries (index, server, cli)
- Verifies DTS generation works
- Releases are handled by release-please (merging the release PR), so CI has no release dry-run step

### CI Pipeline (`.github/workflows/ci.yml`)

Runs on every pull request targeting `main` and on pushes to `main`.

1. `pnpm install --frozen-lockfile`
2. `pnpm lint`
3. `pnpm format:check`
4. `pnpm typecheck`
5. `pnpm test`
6. `pnpm build`

## Definition of "Done"

A change is complete when all of the following hold:

- [ ] `pnpm lint` passes
- [ ] `pnpm format:check` passes
- [ ] `pnpm typecheck` passes
- [ ] `pnpm test` passes
- [ ] `pnpm build` completes successfully
- [ ] README.md updated via `pnpm readme` when a new tool is added
- [ ] Commit message follows Conventional Commits
- [ ] No unnecessary files (dist, node_modules, etc.) included in the commit
- [ ] When `src/common/` changes, all three consumers (MCP server, CLI, doc generation) are verified
