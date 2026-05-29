import { defineTool, toolDef, text } from '@common';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// 패키지에서 제공(인식)하는 환경 변수 키 목록
// MCP client config.json의 env 필드에 이 키들만 설정할 수 있습니다.
// ---------------------------------------------------------------------------

/**
 * `@julong/mono-rele2-utils` 패키지가 인식하는 환경 변수 키 목록.
 * MCP client config의 env 블록에 이 키들만 유효하며,
 * `env_get` 도구도 이 키들에 대해서만 조회를 허용합니다.
 *
 * @example
 * ```json
 * {
 *   "mcpServers": {
 *     "@julong/mono-rele2-utils": {
 *       "command": "npx",
 *       "args": ["-y", "@julong/mono-rele2-utils"],
 *       "env": {
 *         "API_KEY": "<value>"
 *       }
 *     }
 *   }
 * }
 * ```
 */
export const UTILS_ENV_KEYS = ['API_KEY'] as const;

export type UtilsEnvKey = (typeof UTILS_ENV_KEYS)[number];

// ---------------------------------------------------------------------------
// env_get — 핵심 함수
// ---------------------------------------------------------------------------

/**
 * 패키지가 제공하는 환경 변수(`UTILS_ENV_KEYS`) 값을 조회합니다.
 * 유효하지 않은 키를 요청하면 에러를 반환합니다.
 *
 * @param keys - 조회할 환경 변수 이름 목록. 모두 `UTILS_ENV_KEYS`에 포함되어야 합니다.
 * @returns `{ "API_KEY": "<value>" }` 형태의 key-value 객체
 *
 * @example
 * envGet(["API_KEY"])
 * // → { "API_KEY": "<value>" }
 */
export function envGet(keys: string[]): Record<string, string> {
  const invalidKeys = keys.filter((k) => !(UTILS_ENV_KEYS as readonly string[]).includes(k));
  if (invalidKeys.length > 0) {
    throw new Error(
      `Invalid env key(s): ${invalidKeys.join(', ')}. ` +
        `Allowed keys: ${UTILS_ENV_KEYS.join(', ')}`,
    );
  }

  const result: Record<string, string> = {};

  for (const key of keys) {
    const value = process.env[key];
    if (value !== undefined) {
      result[key] = value;
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// MCP Tool 정의
// ---------------------------------------------------------------------------

export const tools = {
  envGetTool: toolDef({
    name: 'env_get',
    description:
      'MCP 클라이언트 config의 env 필드를 통해 주입된 환경 변수 값을 조회합니다. ' +
      '조회 가능한 키는 패키지에서 제공하는 환경 변수로 한정됩니다. ' +
      `현재 지원: ${UTILS_ENV_KEYS.join(', ')}.`,
    inputSchema: {
      keys: z
        .array(z.string())
        .nonempty()
        .describe(`조회할 환경 변수 이름 목록 (유효 키: ${UTILS_ENV_KEYS.join(', ')})`),
    },
    typeLabels: {
      keys: 'string[]',
    },
    typeDefs: {
      keys: [
        '// @julong/mono-rele2-utils 환경 변수 키 목록',
        ...UTILS_ENV_KEYS.map((k) => `//   "${k}"`),
        '',
        '// MCP client config 예시:',
        '// {',
        '//   "mcpServers": {',
        '//     "@julong/mono-rele2-utils": {',
        '//       "command": "npx",',
        '//       "args": ["-y", "@julong/mono-rele2-utils"],',
        '//       "env": {',
        ...UTILS_ENV_KEYS.map((k) => `//         "${k}": "<value>"`),
        '//       }',
        '//     }',
        '//   }',
        '// }',
      ].join('\n'),
    },
    returnType: 'Record<string, string>',
    returnDescription: 'key: 환경 변수 이름, value: 해당 값 (설정되지 않은 변수는 결과에서 제외)',
    handler: async ({ keys }) => {
      try {
        const result = envGet(keys);
        if (Object.keys(result).length === 0) {
          return text('(no matching environment variables found)');
        }
        return text(JSON.stringify(result, null, 2));
      } catch (err) {
        return text(`Error: ${(err as Error).message}`);
      }
    },
    examples: [
      {
        args: [`'["API_KEY"]'`],
        result: JSON.stringify({ API_KEY: '<value>' }, null, 2),
      },
    ],
    guidelines: [
      `조회 가능한 키: ${UTILS_ENV_KEYS.join(', ')}`,
      'MCP client config.json의 env 필드에 위 키들만 설정할 수 있습니다.',
      '유효하지 않은 키를 요청하면 에러 메시지에 허용된 키 목록이 표시됩니다.',
      '설정되지 않은 환경 변수는 결과 객체에서 제외됩니다.',
    ],
  }),
};

export const envGetTool = defineTool(tools.envGetTool);
