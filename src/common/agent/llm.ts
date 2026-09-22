import { ChatOpenAI } from '@langchain/openai';

/**
 * 이 키트가 읽는 LLM 환경 변수.
 *
 * SiliconFlow처럼 OpenAI 호환 엔드포인트를 쓰는 공급자를 기본으로 하며,
 * `.env`에 아래 값을 채워 두면 됩니다.
 *
 * ```sh
 * SILICONFLOW_URL=https://api.siliconflow.cn/v1
 * SILICONFLOW_MODEL=Qwen/Qwen3-8B
 * OPENAI_API_KEY=<key>
 * ```
 */
export const LLM_ENV_KEYS = ['SILICONFLOW_URL', 'SILICONFLOW_MODEL', 'OPENAI_API_KEY'] as const;

export interface ChatModelOptions {
  model?: string;
  baseURL?: string;
  apiKey?: string;
  temperature?: number;
  maxRetries?: number;
}

/** 환경 변수에서 API 키를 찾습니다. 공급자마다 관례가 달라 순서대로 훑습니다. */
function resolveApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY || process.env.SILICONFLOW_API_KEY || process.env.API_KEY;
}

/**
 * OpenAI 호환 엔드포인트를 쓰는 채팅 모델을 만듭니다.
 *
 * 인자로 준 값이 환경 변수보다 우선합니다.
 *
 * @throws API 키를 어디에서도 찾지 못한 경우
 */
export function createChatModel(options: ChatModelOptions = {}): ChatOpenAI {
  const apiKey = options.apiKey ?? resolveApiKey();
  if (!apiKey) {
    throw new Error(
      `LLM API key not found — set one of ${LLM_ENV_KEYS.join(', ')} (or SILICONFLOW_API_KEY / API_KEY) in your .env`,
    );
  }

  return new ChatOpenAI({
    model: options.model ?? process.env.SILICONFLOW_MODEL ?? 'Qwen/Qwen3-8B',
    temperature: options.temperature ?? 0.3,
    configuration: {
      apiKey,
      baseURL: options.baseURL ?? process.env.SILICONFLOW_URL,
      maxRetries: options.maxRetries ?? 3,
    },
  });
}
