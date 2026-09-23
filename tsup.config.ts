import { defineConfig } from 'tsup';
import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// The skill/README generators key off the CLI bin name, so it is derived from
// package.json rather than hard-coded — renaming the bin renames the skill.
const binName = Object.entries(pkg.bin ?? {}).find(([, v]) => String(v).endsWith('cli.js'))?.[0];
if (!binName) throw new Error('No CLI bin (./dist/cli.js) entry found in package.json');

const skillDir = `skills/${binName}`;
const skillFile = `${skillDir}/SKILL.md`;

function addShebang(path: string): void {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf-8');
  if (!content.startsWith('#!/usr/bin/env node')) {
    writeFileSync(path, `#!/usr/bin/env node\n${content}`);
  }
}

export default defineConfig([
  {
    format: ['esm', 'cjs'],
    minify: true,
    // Everything is inlined so the published bundle has no install-time deps,
    // except Playwright — it resolves browser drivers and platform binaries from
    // its own package directory at runtime and cannot be bundled.
    noExternal: [/^(?!playwright)/],
    external: [/^playwright/],
    splitting: true,
    // CJS 쪽 코드 분할을 rollup이 맡습니다. 끄면 tsup이 minify된 esbuild 출력에
    // sucrase를 한 번 더 돌려 CJS로 바꾸는데, 그 변환이 `return(await x)?.y ?? z`를
    // `returnawait ...`로 붙여 놓아 `dist/*.cjs`가 통째로 파싱되지 않습니다.
    treeshake: true,
    entry: {
      index: 'src/index.ts',
      server: 'src/server.ts',
      cli: 'src/cli.ts',
    },
    dts: { entry: ['src/index.ts'], resolve: [/^@\//] },
    clean: true,
    onSuccess: async () => {
      // Add shebangs to server and CLI entries (post-build)
      for (const name of ['server', 'cli']) {
        addShebang(`./dist/${name}.js`);
        addShebang(`./dist/${name}.cjs`);
      }

      // Remove empty or trivial chunks (code splitting artifacts)
      for (const file of readdirSync('./dist')) {
        if (!file.startsWith('chunk-')) continue;
        const content = readFileSync(`./dist/${file}`, 'utf-8').trim();
        if (content.length === 0 || content === '"use strict";') {
          unlinkSync(`./dist/${file}`);
        }
      }

      // Generate skill markdown (dev only)
      if (process.env.npm_lifecycle_event === 'dev') {
        const distUrl = pathToFileURL(resolve('./dist/index.js')).href;
        const { tools, generateSkillMarkdown } = await import(distUrl);
        const content = generateSkillMarkdown({
          binName,
          description: pkg.description,
          tools,
        });
        mkdirSync(skillDir, { recursive: true });
        writeFileSync(skillFile, content);
        console.log(`Skills generated: ${skillFile}`);
        execSync('bun scripts/update-readme.mjs', { stdio: 'inherit' });
      }
    },
  },
]);
