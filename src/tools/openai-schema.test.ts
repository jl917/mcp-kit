import { describe, expect, it } from '@rstest/core';
import { z } from 'zod';
import { tools } from '@/tools/index';

/**
 * OpenAI 도구 스키마가 받지 않는 JSON Schema 키워드.
 *
 * 함수 호출 가이드의 strict 모드는 JSON Schema의 일부만 받습니다. 여기 있는
 * 키워드가 하나라도 남으면 요청 전체가 400으로 돌아오므로, 값의 범위나 기본값은
 * 스키마가 아니라 `description`과 도메인 계층이 맡습니다.
 *
 * `default`는 별도로 다룹니다 — 거절 대상이면서, 남아 있으면 모델이 기본값을
 * 스키마에서 읽었다고 착각하게 만듭니다.
 */
const UNSUPPORTED_KEYWORDS = [
  'default',
  'pattern',
  'format',
  'minLength',
  'maxLength',
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  'patternProperties',
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
  'propertyNames',
  'contains',
  'minContains',
  'maxContains',
  'unevaluatedItems',
  'unevaluatedProperties',
  'prefixItems',
  'allOf',
  'not',
  'if',
  'then',
  'else',
  'dependentRequired',
  'dependentSchemas',
  'dependencies',
] as const;

/**
 * MCP 서버가 클라이언트에 내보내는 JSON Schema를 그대로 만듭니다.
 *
 * `@modelcontextprotocol/sdk`는 zod 4 스키마를 `toJSONSchema(schema, { target:
 * 'draft-7', io: 'input' })`로 바꿉니다(`server/zod-json-schema-compat.js`).
 * 검사가 실제로 나가는 문서를 보도록 같은 설정을 씁니다.
 */
function toMcpJsonSchema(shape: z.ZodRawShape): Record<string, unknown> {
  return z.toJSONSchema(z.object(shape), { target: 'draft-7', io: 'input' }) as Record<
    string,
    unknown
  >;
}

/** 중첩된 스키마까지 훑어 금지된 키워드가 쓰인 경로를 모읍니다. */
function findUnsupported(node: unknown, path = '$'): string[] {
  if (node === null || typeof node !== 'object') return [];
  if (Array.isArray(node)) {
    return node.flatMap((item, index) => findUnsupported(item, `${path}[${index}]`));
  }

  const found: string[] = [];
  for (const [key, value] of Object.entries(node)) {
    if ((UNSUPPORTED_KEYWORDS as readonly string[]).includes(key)) {
      found.push(`${path}.${key}`);
    }
    found.push(...findUnsupported(value, `${path}.${key}`));
  }
  return found;
}

const entries = Object.entries(tools);

describe('OpenAI tool schema conformance', () => {
  it('should cover every exported tool', () => {
    expect(entries.length).toBe(10);
  });

  // 가이드: "All fields in `properties` must be marked as `required`."
  // 값을 비우는 뜻은 `null`로만 나타내므로 생략 가능한 필드가 있으면 안 됩니다.
  it.each(entries)('should mark every field of %s as required', (_key, tool) => {
    const schema = toMcpJsonSchema(tool.inputSchema);
    const properties = Object.keys((schema.properties ?? {}) as Record<string, unknown>);

    expect(properties).toEqual(Object.keys(tool.inputSchema));
    expect([...((schema.required ?? []) as string[])].sort()).toEqual([...properties].sort());
  });

  it.each(entries)('should leave no unsupported keyword in %s', (_key, tool) => {
    expect(findUnsupported(toMcpJsonSchema(tool.inputSchema))).toEqual([]);
  });

  // 기본값과 범위를 스키마에서 걷어냈으므로, 모델이 읽을 자리는 description뿐입니다.
  it.each(entries)('should describe every field of %s', (_key, tool) => {
    for (const [field, fieldSchema] of Object.entries(tool.inputSchema)) {
      expect((fieldSchema as z.ZodTypeAny).description, `${field} has no description`).toBeTruthy();
    }
  });
});
