import { defineConfig } from '@rstest/core';
import { resolve } from 'node:path';

const common = resolve(import.meta.dirname, 'packages/common/index.ts');

// Per-package projects so that `@` resolves to each package's own `src`.
// A single root alias could not disambiguate `@` between packages.
export default defineConfig({
  projects: [
    {
      name: 'core',
      include: ['packages/core/src/**/*.test.ts'],
      resolve: {
        alias: {
          '@common': common,
          '@': resolve(import.meta.dirname, 'packages/core/src'),
        },
      },
    },
    {
      name: 'utils',
      include: ['packages/utils/src/**/*.test.ts'],
      resolve: {
        alias: {
          '@common': common,
          '@': resolve(import.meta.dirname, 'packages/utils/src'),
        },
      },
    },
  ],
  coverage: {
    enabled: true,
    provider: 'v8',
    include: ['packages/core/src/**/*.ts', 'packages/utils/src/**/*.ts'],
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
    reporters: ['text', 'html', 'lcov'],
    reportsDirectory: './coverage',
  },
});
