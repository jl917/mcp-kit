import { createTsupConfig } from '../common/build/tsup.config.mjs';

const [base] = createTsupConfig() as Array<Record<string, unknown>>;

// The shared config bundles every dependency (`noExternal: [/./]`). Playwright cannot be
// bundled — it resolves browser drivers and platform binaries from its own package directory
// at runtime — so it is the one import left external and installed from `dependencies`.
export default [
  {
    ...base,
    noExternal: [/^(?!playwright)/],
    external: [/^playwright/],
  },
];
