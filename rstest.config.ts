import { defineConfig } from '@rstest/core';
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

const root = import.meta.dirname;
const common = resolve(root, 'packages/common/index.ts');
const packagesDir = resolve(root, 'packages');

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
      alias: {
        '@common': common,
        '@': src,
      },
    },
  });
}

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
