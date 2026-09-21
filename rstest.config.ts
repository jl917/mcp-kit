import { defineConfig } from '@rstest/core';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;
const common = resolve(root, 'packages/common/index.ts');
const commonAgent = resolve(root, 'packages/common/agent/index.ts');
const packagesDir = resolve(root, 'packages');

// `$` pins the alias to an exact request. Without it `@common` would also swallow
// `@common/agent` and try to resolve it under `common/index.ts`.
const commonAliases = { '@common$': common, '@common/agent$': commonAgent };

// Scan `packages/` and build one project per package that has a `src` directory.
// Root stays package-agnostic: adding/removing a package needs no change here.
// Per-package projects also let `@` resolve to each package's own `src`
// (a single root alias could not disambiguate `@` between packages).
const projects = [];
for (const entry of readdirSync(packagesDir, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  const src = resolve(packagesDir, entry.name, 'src');
  if (!existsSync(src)) continue;
  projects.push({
    name: entry.name,
    include: [`packages/${entry.name}/src/**/*.test.ts`],
    resolve: {
      alias: { ...commonAliases, '@': src },
    },
  });
}

// `packages/common` is excluded from the pnpm workspace and has no `src/`, so the scan
// above skips it. Register it explicitly so its own tests still run.
projects.push({
  name: 'common',
  include: ['packages/common/**/*.test.ts'],
  resolve: { alias: { ...commonAliases } },
});

export default defineConfig({
  projects,
  coverage: {
    enabled: true,
    provider: 'v8',
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
    reporters: ['text', 'html', 'lcov'],
    reportsDirectory: './coverage',
  },
});
