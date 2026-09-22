import { join } from 'node:path';
import type { RspressPlugin } from '@rspress/core';

/**
 * Serves the generated root README.md — the tool API reference produced by
 * `pnpm readme` — as an `/api` page, mirrored under every configured locale.
 *
 * The README is single-language and shared as-is across locales.
 */
export function readmeDocsPlugin(): RspressPlugin {
  const readmePath = join(process.cwd(), 'README.md');

  // Locale route prefixes: the default lang lives at the root (no prefix),
  // every other configured locale is served under /{lang}. rspress auto-prefixes
  // nav/sidebar links per active locale, so each locale needs its own page.
  // Captured in config() so addPages() mirrors the same locale set.
  let localePrefixes: string[] = [''];

  return {
    name: 'readme-docs-plugin',

    config(config) {
      const defaultLang = config.lang;
      const others = (config.locales ?? [])
        .filter((locale) => locale.lang !== defaultLang)
        .map((locale) => `/${locale.lang}`);
      // '' is the default-locale root prefix.
      localePrefixes = ['', ...others];
      return config;
    },

    addPages() {
      return localePrefixes.map((prefix) => ({
        routePath: `${prefix}/api`,
        filepath: readmePath,
      }));
    },
  };
}
