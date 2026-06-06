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
        // Add shebangs to server and CLI entries (post-build)
        for (const name of ["server", "cli"]) {
          addShebang(`./dist/${name}.js`);
          addShebang(`./dist/${name}.cjs`);
        }

        // Remove empty or trivial chunks (code splitting artifacts)
        for (const file of readdirSync("./dist")) {
          if (!file.startsWith("chunk-")) continue;
          const content = readFileSync(`./dist/${file}`, "utf-8").trim();
          if (content.length === 0 || content === '"use strict";') {
            unlinkSync(`./dist/${file}`);
          }
        }

        // Generate skill markdown (dev only)
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
