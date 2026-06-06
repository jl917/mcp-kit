import { defineConfig } from "tsup";
import { execSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function addShebang(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf-8");
  if (!content.startsWith("#!/usr/bin/env node")) {
    writeFileSync(path, `#!/usr/bin/env node\n${content}`);
  }
}

export function createTsupConfig() {
  const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
  const cliBin = Object.entries(pkg.bin ?? {}).find(([, v]) => String(v).endsWith("cli.js"))?.[0];
  if (!cliBin) throw new Error("No CLI bin (./dist/cli.js) entry found in package.json");
  const binName = cliBin;
  const skillDir = `skills/${binName}`;
  const skillFile = `${skillDir}/skill.md`;

  return defineConfig([
    {
      format: ["esm", "cjs"],
      minify: true,
      noExternal: [/./],
      splitting: true,
      entry: {
        index: "src/index.ts",
        server: "src/server.ts",
        cli: "src/cli.ts",
      },
      dts: { entry: ["src/index.ts"], resolve: [/^@julong\//, /^@common$/] },
      clean: true,
      onSuccess: async () => {
        const dist = "./dist";

        // 1) Rename chunk-* → common.js / common.cjs and update import refs
        for (const suffix of [".js", ".cjs"]) {
          const chunks = readdirSync(dist).filter((f) => f.startsWith("chunk-") && f.endsWith(suffix));
          if (chunks.length === 0) continue;

          // Find the meaningful chunk (skip empty / "use strict"; artifacts)
          const real = chunks.find((f) => {
            const c = readFileSync(`${dist}/${f}`, "utf-8").trim();
            return c.length > 0 && c !== '"use strict";';
          });
          if (!real) continue;

          const chunkName = real;
          const chunkContent = readFileSync(`${dist}/${chunkName}`, "utf-8");

          // Update import paths in entry files: ./chunk-XXXXX.js → ./common.js
          for (const entry of ["index", "server", "cli"]) {
            const ePath = `${dist}/${entry}${suffix}`;
            if (!existsSync(ePath)) continue;
            const content = readFileSync(ePath, "utf-8");
            const escaped = chunkName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            writeFileSync(ePath, content.replace(new RegExp(`\\./${escaped}`, "g"), `./common${suffix}`));
          }

          // Write as common.js / common.cjs and remove old chunk
          writeFileSync(`${dist}/common${suffix}`, chunkContent);
          unlinkSync(`${dist}/${chunkName}`);
        }

        // 2) Clean up remaining empty / trivial chunk artifacts and their references
        for (const f of readdirSync(dist)) {
          if (!f.startsWith("chunk-")) continue;
          const c = readFileSync(`${dist}/${f}`, "utf-8").trim();
          if (c.length === 0 || c === '"use strict";') {
            unlinkSync(`${dist}/${f}`);
            // Remove stale import references to this chunk from entry files
            const escaped = f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const staleImport = new RegExp(`import"\\./${escaped}"`, "g");
            for (const suffix of [".js", ".cjs"]) {
              for (const entry of ["index", "server", "cli"]) {
                const ePath = `${dist}/${entry}${suffix}`;
                if (!existsSync(ePath)) continue;
                writeFileSync(ePath, readFileSync(ePath, "utf-8").replace(staleImport, ""));
              }
            }
          }
        }

        // 3) Add shebangs to server and CLI entries
        for (const name of ["server", "cli"]) {
          addShebang(`./dist/${name}.js`);
          addShebang(`./dist/${name}.cjs`);
        }

        // 4) Generate skill markdown (dev only)
        if (process.env.npm_lifecycle_event === "dev") {
          const distUrl = pathToFileURL(resolve("./dist/index.js")).href;
          const { tools, generateSkillMarkdown } = await import(distUrl);
          const content = generateSkillMarkdown({
            binName,
            description: pkg.description,
            tools,
          });
          mkdirSync(skillDir, { recursive: true });
          writeFileSync(skillFile, content);
          console.log(`Skills generated: ${skillFile}`);
          execSync("bun ../common/build/update-readme.mjs", {
            cwd: resolve("."),
            stdio: "inherit",
          });
        }
      },
    },
  ]);
}
