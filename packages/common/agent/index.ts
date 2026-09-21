// LLM/에이전트 키트는 `@common`(kit/index.ts)에서 재노출하지 않습니다.
// 각 패키지의 tsup 설정이 `noExternal: [/./]`로 모든 의존성을 인라인하기 때문에,
// 여기서 재노출하면 langchain·deepagents까지 MCP 서버 번들에 끌려 들어갑니다.
// 필요한 쪽에서만 `@common/agent`로 직접 가져다 씁니다.
export { createChatModel, LLM_ENV_KEYS } from "./llm.js";
export type { ChatModelOptions } from "./llm.js";

export { appendLog, FileLogCallback, formatLogBlock, logFileFor, LOG_DIR } from "./log.js";
export type { ToolCallRecord } from "./log.js";

export { nodeMcpServer, runMcpAgent } from "./runner.js";
export type { McpAgentRunOptions, McpAgentRunResult, McpStdioServer } from "./runner.js";
