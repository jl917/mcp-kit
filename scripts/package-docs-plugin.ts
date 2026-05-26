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
  const packagesDir = join(process.cwd(), 'packages');

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

  function generateOverviewMarkdown(packages: PackageInfo[]): string {
    const rows = packages
      .map((p) => {
        const meta = getPackageMeta(p.name);
        return `| [${p.displayName}](/packages/${p.name}) | ${meta.version} | ${meta.description} |`;
      })
      .join('\n');

    return `# Packages\n\nmcp-kit 모노레포는 다음 패키지들로 구성되어 있습니다.\n\n## 패키지 목록\n\n| 패키지 | 버전 | 설명 |\n|--------|------|------|\n${rows}\n\n각 패키지는 독립적인 MCP 서버로 동작하며, CLI 도구와 MCP 서버 인터페이스를 동시에 제공합니다.`;
  }

  return {
    name: 'package-docs-plugin',

    config(config) {
      const packages = getPackages();
      const items = [
        { text: 'Overview', link: '/packages' },
        ...packages.map((p) => ({ text: p.displayName, link: `/packages/${p.name}` })),
      ];

      // Populate sidebar for /packages
      const sidebar = config.themeConfig?.sidebar as Record<string, { text: string; items: unknown[] }[]> | undefined;
      const packagesSidebar = sidebar?.['/packages'];
      if (packagesSidebar?.[0]) {
        packagesSidebar[0].items = items;
      }

      return config;
    },

    addPages() {
      const packages = getPackages();
      const pages: { routePath: string; filepath?: string; content?: string }[] = [];

      // Overview page: dynamically generated table of all packages
      pages.push({
        routePath: '/packages',
        content: generateOverviewMarkdown(packages),
      });

      // Individual package pages: point directly to real README.md files
      for (const p of packages) {
        pages.push({
          routePath: `/packages/${p.name}`,
          filepath: join(packagesDir, p.name, 'README.md'),
        });
      }

      return pages;
    },
  };
}
