import type { BaseLanguageModel } from '@langchain/core/language_models/base';
import { MultiServerMCPClient } from '@langchain/mcp-adapters';
import { createDeepAgent } from 'deepagents';
import { existsSync } from 'node:fs';
import { createChatModel } from './llm.js';
import { appendLog, FileLogCallback, type ToolCallRecord } from './log.js';

/** stdio로 띄우는 MCP 서버 한 대의 실행 방법. */
export interface McpStdioServer {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

/**
 * 이 저장소가 빌드해 둔 MCP 서버 번들을 stdio로 띄우는 설정을 만듭니다.
 *
 * 서버를 지금 이 프로세스와 같은 런타임(`process.execPath`)으로 띄웁니다.
 * PATH에 `node`가 있는지에 기대지 않고, bun으로 실행 중이면 서버도 bun으로 돕니다.
 *
 * @param name - 에이전트 쪽에서 이 서버를 가리킬 이름
 * @param entryPath - 빌드된 서버 진입점 (보통 `<repo>/dist/server.js`)
 * @throws 번들이 없으면 빌드가 필요하다는 에러를 던집니다
 *
 * @example
 * ```ts
 * const servers = nodeMcpServer("mcp-kit", resolve(repoRoot, "dist/server.js"));
 * await runMcpAgent({ taskId, prompt, systemPrompt, servers });
 * ```
 */
export function nodeMcpServer(name: string, entryPath: string): Record<string, McpStdioServer> {
  if (!existsSync(entryPath)) {
    throw new Error(`MCP server bundle not found at ${entryPath} — run \`pnpm build\` first`);
  }
  return { [name]: { command: process.execPath, args: [entryPath] } };
}

export interface McpAgentRunOptions {
  /** 로그 파일 이름이자 실행 한 싸이클을 묶는 키. */
  taskId: string;
  /** 에이전트에게 건넬 사용자 메시지. */
  prompt: string;
  /** 에이전트의 시스템 프롬프트. */
  systemPrompt: string;
  /** 서버 이름 → 실행 방법. 여기 등록된 MCP 도구가 에이전트에 그대로 연결됩니다. */
  servers: Record<string, McpStdioServer>;
  /** 생략하면 `createChatModel()`이 환경 변수로 모델을 만듭니다. */
  model?: BaseLanguageModel;
  recursionLimit?: number;
}

export interface McpAgentRunResult {
  taskId: string;
  /** 이번 실행이 기록된 로그 파일 경로. */
  logFile: string;
  elapsedMs: number;
  /** MCP 서버에서 받아온 도구 이름 목록 (호출 여부와 무관하게 "쓸 수 있는" 도구). */
  toolNames: string[];
  /** LLM이 실제로 호출한 도구 기록 (호출 순서). */
  toolCalls: ToolCallRecord[];
  /** 에이전트의 마지막 응답 텍스트. */
  output: string;
  /** 대화에 쌓인 메시지 전체 (원본). */
  messages: unknown[];
}

/**
 * MCP 서버를 띄워 그 도구로 무장한 deep agent를 한 번 실행합니다.
 *
 * 실행 한 싸이클(RUN START → MCP 도구 목록 → LLM/도구 호출 → RUN END)이
 * 모두 `src/common/.log/<taskId>.log`에 남습니다.
 *
 * MCP 클라이언트는 자식 프로세스를 띄우므로 성공·실패와 무관하게 항상 닫습니다.
 *
 * @throws 에이전트 실행이 실패하면 로그에 RUN ERROR를 남기고 그대로 다시 던집니다.
 */
export async function runMcpAgent(options: McpAgentRunOptions): Promise<McpAgentRunResult> {
  const { taskId, prompt, systemPrompt, servers, recursionLimit = 30 } = options;
  const logger = new FileLogCallback(taskId);
  const model = options.model ?? createChatModel();

  appendLog(taskId, 'RUN START', {
    taskId,
    prompt,
    servers,
    model: describeModel(model),
    recursionLimit,
  });

  const client = new MultiServerMCPClient(servers);

  try {
    const tools = await client.getTools();
    const toolNames = tools.map((t) => t.name);
    appendLog(taskId, 'MCP TOOLS', toolNames);

    const agent = createDeepAgent({ model, tools, systemPrompt });

    const result = (await agent.invoke(
      { messages: [{ role: 'user', content: prompt }] },
      {
        callbacks: [logger],
        recursionLimit,
        configurable: { thread_id: taskId },
      },
    )) as { messages?: unknown[] };

    const messages = result.messages ?? [];
    const output = lastMessageText(messages);
    const toolCalls = logger.toolCalls;
    appendLog(
      taskId,
      'RUN END',
      {
        elapsedMs: logger.elapsedMs,
        toolCalls: toolCalls.map(({ name, input, durationMs, error }) => ({
          name,
          input,
          durationMs,
          error,
        })),
        output,
      },
      logger.elapsedMs,
    );

    return {
      taskId,
      logFile: logger.logFile,
      elapsedMs: logger.elapsedMs,
      toolNames,
      toolCalls,
      output,
      messages,
    };
  } catch (err) {
    appendLog(taskId, 'RUN ERROR', err, logger.elapsedMs);
    throw err;
  } finally {
    await client.close().catch(() => undefined);
  }
}

/** 로그에 남길 만큼만 모델 정보를 추립니다. */
function describeModel(model: unknown): Record<string, unknown> {
  const m = model as { model?: string; modelName?: string; temperature?: number };
  return { model: m.model ?? m.modelName, temperature: m.temperature };
}

/**
 * 마지막 메시지의 텍스트를 뽑습니다.
 * content는 문자열일 수도, 멀티모달 블록 배열일 수도 있어 둘 다 받습니다.
 */
function lastMessageText(messages: unknown[]): string {
  const last = messages.at(-1) as { content?: unknown } | undefined;
  const content = last?.content;

  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content
      .map((part) => (typeof part === 'string' ? part : ((part as { text?: string }).text ?? '')))
      .join('');
  }
  return '';
}
