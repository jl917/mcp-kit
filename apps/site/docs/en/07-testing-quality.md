# 7. Testing & Quality Standards

## Current Status

> **Tests are implemented with Rstest.**
> The test framework is configured and `*.test.ts` files exist.

### Test Results (47 tests)

| Package | File | Tests |
|---------|------|-------|
| core | `src/tools/system.test.ts` | 10 |
| utils | `src/tools/env.test.ts` | 7 |
| utils | `src/tools/text.test.ts` | 14 |
| utils | `src/tools/deep.test.ts` | 9 |
| utils | `src/tools/user.test.ts` | 7 |

## Testing Standards

### Core Scenarios That Must Be Tested

| Priority | Target | Test Content |
|----------|--------|-------------|
| 🔴 High | Each tool handler | Normal input, edge cases, error input responses |
| 🔴 High | Zod schema validation | Verify Optional, Default, Enum and other Zod type behavior |
| 🟡 Medium | MCP server registration | Verify `createMcpServer()` registers all tools correctly |
| 🟡 Medium | CLI parsing | `runCli()` argument parsing (including JSON auto-parsing) |
| 🟢 Low | Documentation generation | `generateReadmeSkills()` output format |

### Test Rules for New Code

1. **Every new tool** must include unit tests for its handler
2. **When adding/changing parameter Zod schemas**, add validation tests
3. **Include tests** that verify `examples` actually work
4. **Snapshot test** that `guidelines` render correctly in documentation

## Current Quality Verification

### Type Checking

```bash
pnpm typecheck       # Full package type check
```

- Each package's `tsconfig.json` uses `"noEmit": true` for type-check-only config
- `strict: true` mode enabled
- CI runs `pnpm typecheck` first for type safety

### Build Verification

```bash
pnpm build           # turbo run build
```

- Verify tsup correctly bundles all 3 entry points (index, server, cli)
- Verify DTS generation works correctly
- CI validates release possibility with `multi-semantic-release --dry-run` after build

### CI Pipeline (`.github/workflows/ci.yml`)

1. `pnpm install --frozen-lockfile`
2. `pnpm typecheck`
3. `pnpm build`
4. `pnpm exec multi-semantic-release --dry-run`

## Lint Standards

- Uses Rslint for linting
- Manual checks during code review:
  - No `any` type usage (except tool.ts handler)
  - No unnecessary `console.log`
  - No unused imports
  - Consistent import style

## "Task Complete" Criteria

A change is considered "complete" when all of the following are met:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm build` completes successfully
- [ ] `pnpm test` passes (47 tests)
- [ ] `pnpm readme` updates README.md for new tools
- [ ] Commit message follows Conventional Commits format
- [ ] No unnecessary files (dist, node_modules, etc.) included in the commit
- [ ] When `packages/common/` changes, rebuild and test all packages
