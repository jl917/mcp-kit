import { defineConfig } from "tsup";
import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

export function createTsupConfig() {
  const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
  const cliBin = Object.entries(pkg.bin ?? {}).find(([, v]) => String(v).endsWith("cli.js"))?.[0];
  if (!cliBin) throw new Error("No CLI bin (./dist/cli.js) entry found in package.json");
  const binName = cliBin;
  const skillDir = `dist/skills/${binName}`;
  const skillFile = `${skillDir}/skill.md`;

  const shared = {
    format: ["esm", "cjs"],
    external: ["@modelcontextprotocol/sdk", "zod"],
    noExternal: [/^@julong\//, /^@common$/],
    // noExternal: [/./],
    minify: true,
  };

  return defineConfig([
    {
      ...shared,
      entry: { index: "src/index.ts" },
      dts: { resolve: [/^@julong\//, /^@common$/] },
      clean: true,
      onSuccess: async () => {
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
        if (process.env.npm_lifecycle_event === "dev") {
          execSync("bun ../common/build/update-readme.mjs", {
            cwd: resolve("."),
            stdio: "inherit",
          });
        }
      },
    },
    {
      ...shared,
      entry: { server: "src/server.ts" },
      dts: false,
      clean: false,
      banner: { js: "#!/usr/bin/env node" },
    },
    {
      ...shared,
      entry: { cli: "src/cli.ts" },
      dts: false,
      clean: false,
      banner: { js: "#!/usr/bin/env node" },
    },
  ]);
}
