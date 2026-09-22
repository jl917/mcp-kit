import { defineConfig } from '@rstest/core';
import { resolve } from 'node:path';

const src = resolve(import.meta.dirname, 'src');

export default defineConfig({
  include: ['src/**/*.test.ts'],
  resolve: {
    // Mirrors the `@/*` path mapping in tsconfig.json.
    alias: { '@': src },
  },
  coverage: {
    enabled: true,
    provider: 'v8',
    exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**', '**/dist/**'],
    reporters: ['text', 'html', 'lcov'],
    reportsDirectory: './coverage',
  },
});
