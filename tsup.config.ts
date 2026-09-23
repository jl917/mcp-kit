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
// 봉인 형식을 한 곳에만 두려고 런타임이 읽는 모듈에서 그대로 가져옵니다.
import { createSealSecret, sealCredential } from './src/tmdb/embedded';

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

// The skill/README generators key off the CLI bin name, so it is derived from
// package.json rather than hard-coded — renaming the bin renames the skill.
const binName = Object.entries(pkg.bin ?? {}).find(([, v]) => String(v).endsWith('cli.js'))?.[0];
if (!binName) throw new Error('No CLI bin (./dist/cli.js) entry found in package.json');

const skillDir = `skills/${binName}`;
const skillFile = `${skillDir}/SKILL.md`;

/**
 * 빌드 환경의 TMDB 자격 증명을 번들에 심을 값으로 바꿉니다.
 *
 * 값이 있으면 이 빌드를 받은 쪽은 `TMDB_API_KEY`를 따로 넣지 않아도 영화 도구를
 * 쓸 수 있습니다. 없으면 빈 문자열이 들어가고, 도구는 예전처럼 실행 시점의 환경
 * 변수만 봅니다. 봉하고 여는 규칙은 `src/tmdb/embedded.ts`가 갖고 있습니다.
 *
 * 열쇠는 빌드마다 새로 만들어 같은 번들에 함께 넣습니다. 번들을 가진 사람은 언제든
 * 열 수 있으므로 이것은 암호화가 아니라 난독화입니다 — 키가 평문 문자열로 남지
 * 않을 뿐입니다.
 *
 * `.github/workflows/release.yml`의 빌드 단계는 저장소 시크릿을 넘깁니다. 즉 npm에
 * 올라간 패키지에는 자격 증명이 들어 있고, 설치한 사람은 누구나 꺼낼 수 있습니다.
 * 그 자리에 쓰는 키는 공개를 전제로 한 전용 키여야 합니다.
 */
function embeddedCredentials(): Record<string, string> {
  try {
    // 셸에 이미 있는 값이 우선입니다 (Node `loadEnvFile`의 규칙).
    process.loadEnvFile(resolve('.env'));
  } catch {
    // `.env`가 없으면 셸 환경 변수만 봅니다.
  }

  const apiKey = process.env.TMDB_API_KEY?.trim() ?? '';
  const accessToken = process.env.TMDB_ACCESS_TOKEN?.trim() ?? '';
  const embedded = [apiKey && 'TMDB_API_KEY', accessToken && 'TMDB_ACCESS_TOKEN'].filter(Boolean);
  const secret = createSealSecret();

  console.log(
    embedded.length > 0
      ? `TMDB credentials embedded in the bundle (sealed, not secret): ${embedded.join(', ')}`
      : 'TMDB credentials not embedded — the bundle reads the environment at run time',
  );

  return {
    __TMDB_SEAL_SECRET__: JSON.stringify(secret),
    __TMDB_API_KEY__: JSON.stringify(sealCredential(apiKey, secret)),
    __TMDB_ACCESS_TOKEN__: JSON.stringify(sealCredential(accessToken, secret)),
  };
}

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
    define: {
      // 손으로 맞추면 릴리스마다 어긋납니다. release-please는 package.json만 올립니다.
      __PKG_VERSION__: JSON.stringify(pkg.version),
      ...embeddedCredentials(),
    },
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
