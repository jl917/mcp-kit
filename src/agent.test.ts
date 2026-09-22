import { beforeAll, describe, expect, it } from '@rstest/core';
import { logFileFor, nodeMcpServer, runMcpAgent, type ToolCallRecord } from '@/common/agent';
import { existsSync, rmSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CURRENCIES, PROVIDERS, type CurrencyCode, type Provider } from '@/exchange/types';

// ---------------------------------------------------------------------------
// 실행 조건
//
// 이 파일은 실제 LLM과 실제 포털을 모두 호출합니다. API 키·네트워크·Playwright
// 브라우저가 필요하고 한 케이스에 수 분이 걸리므로 기본 `pnpm test`에서는 건너뜁니다.
//
//   pnpm build                          # 에이전트가 띄울 MCP 서버
//   npx playwright install chromium     # 최초 1회
//   pnpm test:agent
//
// 이 저장소는 MCP 도구만 제공합니다. 에이전트를 굴리는 쪽(모델·로깅·MCP 기동)은
// 전부 `@/common/agent`에 있고, 여기서는 어떤 서버를 어떤 프롬프트로 부를지만 정합니다.
// ---------------------------------------------------------------------------

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SERVER_ENTRY = resolve(REPO_ROOT, 'dist/server.js');

// rstest는 .env를 읽지 않으므로 여기서 한 번 불러온다 (이미 있는 환경 변수는 유지).
try {
  process.loadEnvFile(resolve(REPO_ROOT, '.env'));
} catch {
  // .env가 없으면 셸에 이미 있는 환경 변수만 쓴다.
}

const ENABLED = Boolean(process.env.RUN_AGENT_TESTS);
const HAS_API_KEY = Boolean(
  process.env.OPENAI_API_KEY || process.env.SILICONFLOW_API_KEY || process.env.API_KEY,
);

/** LLM 왕복 두 번 + 포털 스크레이핑까지 감당할 여유. */
const AGENT_TIMEOUT_MS = 600_000;

const TASK_ALL = 'rstest-agent-all';
const TASK_SINGLE = 'rstest-agent-single';

// ---------------------------------------------------------------------------
// 에이전트에 물릴 도구와 프롬프트
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `
당신은 환율 조회 에이전트입니다. MCP 도구로 받아온 값만 근거로 답합니다.

## 도구
- \`exchange_rates(providers, currencies, timeoutMs)\` — 포털별·통화별 환율을 한 번에 조회
- \`exchange_rate(provider, currency, timeoutMs)\` — 포털 한 곳의 통화 하나만 조회

## 규칙
1. 환율 값은 반드시 도구 호출 결과에서 가져온다. 절대 추측하거나 기억에 의존하지 않는다.
2. \`rate\` 필드는 1 통화 단위당 원화다. 이 값을 그대로 쓴다.
3. 값이 \`null\`이면 "조회 실패"로 표기하고, 임의의 값으로 채우지 않는다.
4. 요청 범위에 맞게 인자를 좁혀 호출한다. 묻지 않은 포털이나 통화는 인자에 넣지 않는다.
5. 필요한 범위를 한 번의 호출로 모아서 요청한다. 같은 조회를 반복하지 않는다.
6. 포털 하나 × 통화 하나만 필요하면 \`exchange_rate\`를, 그보다 넓으면 \`exchange_rates\`를 쓴다.

## 응답 형식
한국어로 답한다. 값은 도구가 준 \`rate\`를 그대로 옮긴다.

포털이나 통화가 여럿이면 표로 정리한다.

| 통화 | 네이버 | 구글 | 다음 |
|---|---|---|---|
| 중국 CNY | ... | ... | ... |
| 일본 JPY | ... | ... | ... |
| 유로 EUR | ... | ... | ... |

조회한 범위에 해당하는 행과 열만 남긴다. 표 아래에 한 줄로 짧은 코멘트를 덧붙인다.
`.trim();

const PROMPT_ALL =
  '네이버, 구글, 다음에서 중국(CNY)·일본(JPY)·유로(EUR)의 원화 환율을 조회하고 표로 정리해 주세요.';

const PROMPT_SINGLE =
  '다음(daum)에서 일본 엔(JPY) 환율만 조회해 주세요. 다른 포털이나 통화는 필요 없습니다.';

/** 이 저장소가 빌드해 둔 MCP 서버를 띄워 에이전트를 한 번 실행합니다. */
function runAgent(taskId: string, prompt: string) {
  return runMcpAgent({
    taskId,
    prompt,
    systemPrompt: SYSTEM_PROMPT,
    servers: nodeMcpServer('mcp-kit', SERVER_ENTRY),
  });
}

// ---------------------------------------------------------------------------
// 검증 헬퍼
// ---------------------------------------------------------------------------

/** 도구 호출 인자(JSON 문자열)를 객체로 되돌립니다. */
function parseInput(call: ToolCallRecord): Record<string, unknown> {
  try {
    return JSON.parse(call.input) as Record<string, unknown>;
  } catch {
    throw new Error(`tool input was not JSON: ${call.input}`);
  }
}

/** 도구가 돌려준 환율 JSON에서 1단위당 원화 값만 모읍니다. */
function ratesIn(output: string | null): number[] {
  if (!output) return [];
  const rates: number[] = [];
  const walk = (node: unknown): void => {
    if (!node || typeof node !== 'object') return;
    const record = node as Record<string, unknown>;
    if (typeof record.rate === 'number' && record.base === 'KRW') rates.push(record.rate);
    for (const value of Object.values(record)) walk(value);
  };
  walk(JSON.parse(output));
  return rates;
}

/** 답변에 값이 소수점까지 토씨 하나 안 틀리고 들어 있는지 봅니다. */
function quotesExactly(answer: string, value: number): boolean {
  return answer.replace(/,/g, '').includes(String(value));
}

/**
 * 답변에 숫자가 옮겨졌는지 봅니다.
 * LLM이 천 단위 쉼표를 넣거나 소수점 자리를 줄이므로(204.9495 → 204.95)
 * 원본과 2~4자리 반올림까지를 후보로 둡니다.
 *
 * 0~1자리 반올림은 후보에서 뺍니다. "205"는 205.xx 어느 값에나 들어맞아
 * 지어낸 답도 통과시켜 버리기 때문입니다.
 */
function quotesNumber(answer: string, value: number): boolean {
  const normalized = answer.replace(/,/g, '');
  const candidates = new Set([String(value)]);
  for (const digits of [2, 3, 4]) candidates.add(value.toFixed(digits));
  return [...candidates].some((candidate) => normalized.includes(candidate));
}

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------

describe.skipIf(!ENABLED)('exchange agent — LLM이 MCP 도구를 호출하는지', () => {
  beforeAll(() => {
    if (!HAS_API_KEY) {
      throw new Error(
        'RUN_AGENT_TESTS is set but no API key found — fill OPENAI_API_KEY in the repo root .env',
      );
    }
    if (!existsSync(SERVER_ENTRY)) {
      throw new Error(`MCP server bundle not found at ${SERVER_ENTRY} — run \`pnpm build\` first`);
    }
    // 로그는 append라 지난 실행이 남아 있으면 섞인다. 실행마다 새로 쌓는다.
    for (const taskId of [TASK_ALL, TASK_SINGLE]) rmSync(logFileFor(taskId), { force: true });
  });

  it(
    'should expose both MCP tools, call one of them, and answer from its result',
    async () => {
      const result = await runAgent(TASK_ALL, PROMPT_ALL);

      // 1. MCP 서버가 도구를 노출했는가
      expect(result.toolNames.sort()).toEqual(['exchange_rate', 'exchange_rates']);

      // 2. LLM이 실제로 도구를 호출했는가
      expect(result.toolCalls.length).toBeGreaterThan(0);
      for (const call of result.toolCalls) {
        expect(result.toolNames).toContain(call.name);
        expect(call.error).toBeNull();
        expect(call.output).toBeTruthy();
      }

      // 3. 요청한 범위(세 포털 × 세 통화)가 인자에 그대로 담겼는가
      const asked = result.toolCalls.map(parseInput);
      const askedProviders = new Set(
        asked.flatMap((i) => (i.providers ?? [i.provider]) as string[]),
      );
      const askedCurrencies = new Set(
        asked.flatMap((i) => (i.currencies ?? [i.currency]) as string[]),
      );
      for (const provider of PROVIDERS) expect([...askedProviders]).toContain(provider);
      for (const currency of CURRENCIES) expect([...askedCurrencies]).toContain(currency);

      // 4. 도구가 실제 시세를 돌려줬는가.
      //    포털 한 곳이 잠시 막혀도 이 테스트가 깨지지는 않도록 한 포털 분량만 요구한다.
      const rates = result.toolCalls.flatMap((call) => ratesIn(call.output));
      expect(rates.length).toBeGreaterThanOrEqual(CURRENCIES.length);
      for (const rate of rates) expect(rate).toBeGreaterThan(0);

      // 5. 최종 답변이 도구 결과에 근거하는가 — 지어낸 값이 아님을 보이는 핵심 검증.
      //    반올림을 감안해 한 행(포털 수)만큼은 인용돼야 하고,
      //    그중 최소 하나는 소수점까지 원본 그대로여야 한다.
      const quoted = rates.filter((rate) => quotesNumber(result.output, rate));
      expect(quoted.length).toBeGreaterThanOrEqual(PROVIDERS.length);
      expect(rates.some((rate) => quotesExactly(result.output, rate))).toBe(true);

      // 6. 실행 전 싸이클이 로그로 남았는가
      expect(existsSync(result.logFile)).toBe(true);
    },
    AGENT_TIMEOUT_MS,
  );

  it(
    'should narrow the tool arguments to a single portal and currency when asked for one',
    async () => {
      const result = await runAgent(TASK_SINGLE, PROMPT_SINGLE);

      expect(result.toolCalls.length).toBeGreaterThan(0);
      const call = result.toolCalls[0];
      expect(call.error).toBeNull();

      // 단일 조회는 exchange_rate로, 넓은 조회는 exchange_rates로 — 둘 다 허용하되
      // 어느 쪽이든 인자가 요청 범위(daum × JPY)로 좁혀져 있어야 한다.
      const input = parseInput(call);
      const providers = (input.providers ?? [input.provider]) as Provider[];
      const currencies = (input.currencies ?? [input.currency]) as CurrencyCode[];
      expect(providers).toEqual(['daum']);
      expect(currencies).toEqual(['JPY']);

      // 엔화는 100엔 단위로 고시되므로, 정규화된 rate는 원화 환산에서 100원을 넘지 않는다.
      const rates = ratesIn(call.output);
      expect(rates).toHaveLength(1);
      expect(rates[0]).toBeGreaterThan(0);
      expect(rates[0]).toBeLessThan(100);

      expect(quotesExactly(result.output, rates[0])).toBe(true);
    },
    AGENT_TIMEOUT_MS,
  );
});
