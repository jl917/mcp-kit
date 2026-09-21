import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { appendFileSync, mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

/** taskId별 로그 파일이 쌓이는 디렉터리 (`packages/common/.log`). */
export const LOG_DIR = resolve(dirname(fileURLToPath(import.meta.url)), "../.log");

/**
 * taskId에 대응하는 로그 파일 경로를 만듭니다.
 * 경로 구분자나 파일명에 쓸 수 없는 문자가 섞여 있어도
 * `.log` 디렉터리 밖으로 새어 나가지 않도록 전부 `_`로 바꿉니다.
 */
export function logFileFor(taskId: string): string {
  const safe = taskId.replace(/[^\w-]+/g, "_").slice(0, 120) || "task";
  return join(LOG_DIR, `${safe}.log`);
}

/** 값을 통째로 가려야 하는 키 이름. LangChain은 모델 설정을 그대로 직렬화해 넘긴다. */
const SECRET_KEY_PATTERN = /api[-_]?key|secret|password|authorization|access[-_]?token|^token$/i;

/** 키 이름을 놓쳤을 때를 대비한 2차 방어 — 흔한 API 키 토큰 모양을 문자열 안에서 가린다. */
const SECRET_VALUE_PATTERN = /\b(sk|pk|ghp|gho|xox[bpsa])[-_][A-Za-z0-9-_]{16,}\b/g;

export const REDACTED = "[REDACTED]";

/**
 * 순환 참조와 과도한 크기를 잘라내고 자격 증명을 가리며 JSON으로 직렬화합니다.
 *
 * LangChain 콜백이 넘겨주는 객체는 모델·러너를 서로 참조해 그대로
 * `JSON.stringify`하면 순환 참조로 던지거나 로그가 수십 MB로 불어납니다.
 * 또 채팅 모델 설정에는 API 키가 평문으로 들어 있어, 로그 파일을 그대로
 * 공유하면 키가 새어 나갑니다. 키 이름과 값 모양을 모두 보고 가립니다.
 */
function safeStringify(value: unknown, maxStringLength = 4000): string {
  const seen = new WeakSet<object>();
  return JSON.stringify(
    value,
    (key, val) => {
      if (SECRET_KEY_PATTERN.test(key)) return REDACTED;
      if (typeof val === "bigint") return `${val}n`;
      if (typeof val === "function") return `[Function ${val.name || "anonymous"}]`;
      if (typeof val === "string") {
        const masked = val.replace(SECRET_VALUE_PATTERN, REDACTED);
        return masked.length > maxStringLength
          ? `${masked.slice(0, maxStringLength)}… (${masked.length} chars)`
          : masked;
      }
      if (val instanceof Error) {
        return { name: val.name, message: val.message, stack: val.stack };
      }
      if (typeof val === "object" && val !== null) {
        if (seen.has(val)) return "[Circular]";
        seen.add(val);
      }
      return val;
    },
    2,
  );
}

/**
 * 이벤트 하나를 "헤더 한 줄 + JSON 본문" 블록으로 만듭니다.
 *
 * @example
 * ```
 * [2026-09-21T13:21:07.106Z] [TOOL END] (+3396ms)
 * { ... }
 * ```
 */
export function formatLogBlock(type: string, payload: unknown, elapsedMs?: number): string {
  const stamp = new Date().toISOString();
  const elapsed = elapsedMs === undefined ? "" : ` (+${elapsedMs}ms)`;
  return `[${stamp}] [${type}]${elapsed}\n${safeStringify(payload)}\n\n`;
}

/**
 * 이벤트 하나를 taskId의 로그 파일에 덧붙입니다.
 *
 * 로그 기록이 에이전트 실행을 막아서는 안 되므로, 쓰기에 실패하면
 * 콘솔로만 알리고 그대로 진행합니다.
 */
export function appendLog(taskId: string, type: string, payload: unknown, elapsedMs?: number): void {
  try {
    mkdirSync(LOG_DIR, { recursive: true });
    appendFileSync(logFileFor(taskId), formatLogBlock(type, payload, elapsedMs), "utf-8");
  } catch (err) {
    console.error(`[LOG WRITE ERROR] ${type}:`, err);
  }
}

/** LLM이 실제로 호출한 도구 한 건의 기록. */
export interface ToolCallRecord {
  /** 도구 이름 (MCP 도구라면 서버가 노출한 이름). */
  name: string;
  /** LLM이 넘긴 인자. 대개 JSON 문자열입니다. */
  input: string;
  /** 도구가 돌려준 내용. 실패했으면 `null`. */
  output: string | null;
  /** 도구가 던진 에러 메시지. 성공했으면 `null`. */
  error: string | null;
  durationMs: number;
}

/** 아직 끝나지 않은 도구 호출. runId로 시작·종료를 짝지읍니다. */
interface PendingToolCall {
  name: string;
  input: string;
  startedAt: number;
}

/**
 * LangChain이 도구 결과로 넘기는 값(문자열 또는 ToolMessage)에서 본문을 꺼냅니다.
 */
function toolOutputText(output: unknown): string {
  if (typeof output === "string") return output;
  const content = (output as { content?: unknown })?.content;
  if (typeof content === "string") return content;
  return safeStringify(output);
}

/**
 * LangChain 실행 한 싸이클을 통째로 `packages/common/.log/<taskId>.log`에 남기는 콜백.
 *
 * LLM · 체인 · 도구 · 에이전트 · 리트리버 이벤트를 모두 받아 콘솔과 파일에
 * 동시에 기록합니다. 참조 구현이 MongoDB에 적재하던 자리를 파일 append로
 * 바꾼 형태로, taskId 하나가 로그 파일 하나에 대응합니다.
 *
 * 도구 호출은 파일에 남기는 것과 별개로 {@link toolCalls}에 순서대로 모아 둡니다.
 * 로그 파일을 다시 파싱하지 않고도 "LLM이 어떤 도구를 어떤 인자로 불렀는지"를
 * 코드에서 바로 확인할 수 있습니다.
 */
export class FileLogCallback extends BaseCallbackHandler {
  name = "file-log-forward";

  /** 이번 실행에서 LLM이 호출한 도구 기록 (호출 순서). */
  readonly toolCalls: ToolCallRecord[] = [];

  private readonly taskId: string;
  private readonly startedAt = Date.now();
  private readonly pendingTools = new Map<string, PendingToolCall>();
  private lastAt = Date.now();

  constructor(taskId: string) {
    super();
    this.taskId = taskId;
  }

  /** 지금까지 쌓인 로그 파일 경로. */
  get logFile(): string {
    return logFileFor(this.taskId);
  }

  /** 실행 시작 이후 흐른 시간(ms). */
  get elapsedMs(): number {
    return Date.now() - this.startedAt;
  }

  private record(type: string, payload: unknown): void {
    const now = Date.now();
    const sinceLast = now - this.lastAt;
    this.lastAt = now;
    console.log(`[${type}]`, `+${sinceLast}ms`);
    appendLog(this.taskId, type, payload, sinceLast);
  }

  // LLM
  override handleLLMStart(...props: Parameters<NonNullable<BaseCallbackHandler["handleLLMStart"]>>) {
    this.record("LLM START", props);
  }

  override handleLLMEnd(...props: Parameters<NonNullable<BaseCallbackHandler["handleLLMEnd"]>>) {
    this.record("LLM END", props);
  }

  override handleLLMError(...props: Parameters<NonNullable<BaseCallbackHandler["handleLLMError"]>>) {
    this.record("LLM ERROR", props);
  }

  // chat model — LLM START와 같은 흐름으로 본다
  override handleChatModelStart(...props: Parameters<NonNullable<BaseCallbackHandler["handleChatModelStart"]>>) {
    this.record("LLM START", props);
  }

  // chain
  override handleChainStart(...props: Parameters<NonNullable<BaseCallbackHandler["handleChainStart"]>>) {
    this.record("CHAIN START", props);
  }

  override handleChainEnd(...props: Parameters<NonNullable<BaseCallbackHandler["handleChainEnd"]>>) {
    this.record("CHAIN END", props);
  }

  override handleChainError(...props: Parameters<NonNullable<BaseCallbackHandler["handleChainError"]>>) {
    this.record("CHAIN ERROR", props);
  }

  // tool — MCP 도구 호출이 여기로 들어온다
  override handleToolStart(...props: Parameters<NonNullable<BaseCallbackHandler["handleToolStart"]>>) {
    this.record("TOOL START", props);
    // 시그니처: (tool, input, runId, parentRunId, tags, metadata, runName)
    const [, input, runId, , , , runName] = props;
    this.pendingTools.set(runId, {
      name: runName ?? "unknown",
      input: typeof input === "string" ? input : safeStringify(input),
      startedAt: Date.now(),
    });
  }

  override handleToolEnd(...props: Parameters<NonNullable<BaseCallbackHandler["handleToolEnd"]>>) {
    this.record("TOOL END", props);
    const [output, runId] = props;
    this.settleTool(runId, { output: toolOutputText(output), error: null });
  }

  override handleToolError(...props: Parameters<NonNullable<BaseCallbackHandler["handleToolError"]>>) {
    this.record("TOOL ERROR", props);
    const [err, runId] = props;
    const message = err instanceof Error ? err.message : String(err);
    this.settleTool(runId, { output: null, error: message });
  }

  /** 시작해 둔 도구 호출을 결과와 짝지어 {@link toolCalls}에 넣습니다. */
  private settleTool(runId: string, result: { output: string | null; error: string | null }): void {
    const pending = this.pendingTools.get(runId);
    if (!pending) return;
    this.pendingTools.delete(runId);
    this.toolCalls.push({
      name: pending.name,
      input: pending.input,
      output: result.output,
      error: result.error,
      durationMs: Date.now() - pending.startedAt,
    });
  }

  // agent
  override handleAgentAction(...props: Parameters<NonNullable<BaseCallbackHandler["handleAgentAction"]>>) {
    this.record("AGENT ACTION", props);
  }

  override handleAgentEnd(...props: Parameters<NonNullable<BaseCallbackHandler["handleAgentEnd"]>>) {
    this.record("AGENT END", props);
  }

  // retriever
  override handleRetrieverStart(...props: Parameters<NonNullable<BaseCallbackHandler["handleRetrieverStart"]>>) {
    this.record("RETRIEVER START", props);
  }

  override handleRetrieverEnd(...props: Parameters<NonNullable<BaseCallbackHandler["handleRetrieverEnd"]>>) {
    this.record("RETRIEVER END", props);
  }

  override handleRetrieverError(...props: Parameters<NonNullable<BaseCallbackHandler["handleRetrieverError"]>>) {
    this.record("RETRIEVER ERROR", props);
  }

  // other
  override handleText(...props: Parameters<NonNullable<BaseCallbackHandler["handleText"]>>) {
    this.record("TEXT", props);
  }

  override handleCustomEvent(...props: Parameters<NonNullable<BaseCallbackHandler["handleCustomEvent"]>>) {
    this.record("CUSTOM EVENT", props);
  }
}
