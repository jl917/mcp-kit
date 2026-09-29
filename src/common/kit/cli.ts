import { z } from 'zod';
import type { ToolResult } from './tool.js';

// A simple CLI framework for defining and running tools with structured input and output.
type CliTools = Record<
  string,
  {
    name: string;
    description: string;
    inputSchema: z.ZodRawShape;
    handler: (args: any) => Promise<ToolResult>;
  }
>;

export async function runCli(tools: CliTools): Promise<void> {
  const [, , toolName, ...rawArgs] = process.argv;

  if (!toolName || !(toolName in tools)) {
    if (toolName) console.error(`Unknown skill: "${toolName}"\n`);
    process.exit(toolName ? 1 : 0);
  }

  const tool = tools[toolName];
  const fieldNames = Object.keys(tool.inputSchema);
  const rawInput: Record<string, unknown> = {};

  // 도구 스키마는 OpenAI 도구 가이드를 따라 모든 필드를 `required`로 두고, 값을
  // 비우는 뜻을 `null`로만 나타냅니다. 그래서 생략된 자리는 빼지 않고 `null`로
  // 채웁니다 — 빼면 필수 필드 누락으로 검증에서 걸립니다.
  for (let i = 0; i < fieldNames.length; i++) {
    const raw = rawArgs[i];
    if (raw === undefined) {
      rawInput[fieldNames[i]] = null;
      continue;
    }
    try {
      rawInput[fieldNames[i]] = JSON.parse(raw);
    } catch {
      rawInput[fieldNames[i]] = raw;
    }
  }

  const parsed = z.object(tool.inputSchema).parse(rawInput);
  const result = await tool.handler(parsed);

  for (const part of result.content) {
    if (part.type === 'text') console.log(part.text);
  }
}

export function handleCliError(err: unknown): never {
  if (err instanceof z.ZodError) {
    console.error(
      'Validation error:',
      err.issues.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
    );
  } else {
    console.error('Error:', err instanceof Error ? err.message : String(err));
  }
  process.exit(1);
}
