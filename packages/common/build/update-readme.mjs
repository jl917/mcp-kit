import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { generateReadmeApiDocs } from "../kit/skill.ts";

const pkg = JSON.parse(readFileSync("./package.json", "utf-8"));
const pkgName = pkg.name;
const pkgDesc = pkg.description;
const binCli = `${pkgName.split("/").pop()}-cli`;

const toolsUrl = pathToFileURL(join(process.cwd(), "src/tools/index.ts")).href;
const { tools, UTILS_ENV_KEYS } = await import(toolsUrl);

const cliBinName = Object.entries(pkg.bin ?? {}).find(([, v]) => String(v).endsWith("cli.js"))?.[0] ?? binCli;

const envBlock =
  UTILS_ENV_KEYS && UTILS_ENV_KEYS.length > 0
    ? `,\n      "env": {\n${UTILS_ENV_KEYS.map((k) => `        "${k}": "<value>"`).join(",\n")}\n      }`
    : "";

const mcpConfig = `{
  "mcpServers": {
    "${pkgName}": {
      "command": "npx",
      "args": ["-y", "${pkgName}"]${envBlock}
    }
  }
}`;

const toolsText = generateReadmeApiDocs({ binName: cliBinName, tools });

const readme = `# ${pkgName}

${pkgDesc}

## MCP Server

### Configuration

Add to your MCP client config:

\`\`\`json
${mcpConfig}
\`\`\`

### Run

\`\`\`sh
npx -y ${pkgName}
\`\`\`

## CLI

### Installation

\`\`\`sh
npm install -g ${pkgName}
# or
npx ${cliBinName} <toolName> [...args]
\`\`\`

### Usage

\`\`\`sh
${cliBinName} <toolName> [...args]
\`\`\`

Run without arguments to list all available tools:

\`\`\`sh
${cliBinName}
\`\`\`

## Tools API Reference

${toolsText}
`;

writeFileSync("./README.md", readme);
console.log(`[update-readme] ./README.md updated`);
