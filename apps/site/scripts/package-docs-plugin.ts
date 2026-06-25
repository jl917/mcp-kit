import { readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { RspressPlugin } from '@rspress/core';

interface PackageInfo {
  name: string;
  displayName: string;
}

interface PackageMeta {
  version: string;
  description: string;
}

/**
 * Dynamically generates documentation pages from packages/{name}/README.md,
 * auto-populates nav/sidebar, and generates the /packages overview page.
 */
export function packageDocsPlugin(): RspressPlugin {
  // When running from apps/site/, packages/ is at ../../packages
  const packagesDir = join(process.cwd(), '..', '..', 'packages');

  function getPackages(): PackageInfo[] {
    const entries = readdirSync(packagesDir, { withFileTypes: true });
    const packages: PackageInfo[] = [];

    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const readmePath = join(packagesDir, entry.name, 'README.md');
      const pkgJsonPath = join(packagesDir, entry.name, 'package.json');

      if (!existsSync(readmePath)) {
        continue;
      }

      let displayName = entry.name;
      if (existsSync(pkgJsonPath)) {
        try {
          const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
          displayName = pkg.name ?? entry.name;
        } catch {
          // fall through to entry.name
        }
      }

      packages.push({ name: entry.name, displayName });
    }

    return packages;
  }

  function getPackageMeta(name: string): PackageMeta {
    const pkgJsonPath = join(packagesDir, name, 'package.json');
    if (!existsSync(pkgJsonPath)) {
      return { version: '-', description: '' };
    }
    try {
      const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'));
      return {
        version: pkg.version ?? '-',
        description: pkg.description ?? '',
      };
    } catch {
      return { version: '-', description: '' };
    }
  }

  function generateOverviewMarkdown(packages: PackageInfo[], prefix: string): string {
    const rows = packages
      .map((p) => {
        const meta = getPackageMeta(p.name);
        return `| [${p.displayName}](${prefix}/packages/${p.name}) | ${meta.version} | ${meta.description} |`;
      })
      .join('\n');

    return `# Packages\n\nThe mcp-kit monorepo consists of the following packages.\n\n## Package List\n\n| Package | Version | Description |\n|---------|---------|-------------|\n${rows}\n\nEach package runs as an independent MCP server, providing both CLI tools and an MCP server interface.`;
  }

  // Locale route prefixes: the default lang lives at the root (no prefix),
  // every other configured locale is served under /{lang}. rspress auto-prefixes
  // nav/sidebar links per active locale, so each locale needs its own pages.
  function getLocalePrefixes(config: { lang?: string; locales?: { lang: string }[] }): string[] {
    const defaultLang = config.lang;
    const prefixes = (config.locales ?? [])
      .filter((l) => l.lang !== defaultLang)
      .map((l) => `/${l.lang}`);
    // '' is the default-locale root prefix.
    return ['', ...prefixes];
  }

  // Captured in config() so addPages() mirrors the same locale set.
  let localePrefixes: string[] = [''];

  return {
    name: 'package-docs-plugin',

    config(config) {
      const packages = getPackages();
      localePrefixes = getLocalePrefixes(config);
      const sidebar = config.themeConfig?.sidebar as Record<string, { text: string; items: unknown[] }[]> | undefined;

      if (sidebar) {
        for (const prefix of localePrefixes) {
          const items = [
            { text: 'Overview', link: `${prefix}/packages` },
            ...packages.map((p) => ({ text: p.displayName, link: `${prefix}/packages/${p.name}` })),
          ];
          // Reuse the base sidebar group definition (text), populate its items.
          const base = sidebar['/packages']?.[0];
          sidebar[`${prefix}/packages`] = [{ text: base?.text ?? 'Packages', items }];
        }
      }

      return config;
    },

    addPages() {
      const packages = getPackages();
      const pages: { routePath: string; filepath?: string; content?: string }[] = [];

      // Mirror the same routes under each locale prefix (captured in config()).
      // Package READMEs are single-language and shared as-is across locales.
      for (const prefix of localePrefixes) {
        // Overview page: dynamically generated table of all packages
        pages.push({
          routePath: `${prefix}/packages`,
          content: generateOverviewMarkdown(packages, prefix),
        });

        // Individual package pages: point directly to real README.md files
        for (const p of packages) {
          pages.push({
            routePath: `${prefix}/packages/${p.name}`,
            filepath: join(packagesDir, p.name, 'README.md'),
          });
        }
      }

      return pages;
    },
  };
}
