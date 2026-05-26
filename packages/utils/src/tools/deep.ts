import { defineTool, toolDef, text } from "@common";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types — 명확한 스펙 문서화를 위해 JsonValue / JsonObject 재귀 타입 정의
// ---------------------------------------------------------------------------

/**
 * JSON으로 표현 가능한 모든 값.
 * - 원시값: string, number, boolean, null
 * - 배열: JsonValue[]
 * - 중첩 객체: { [key: string]: JsonValue }
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

/**
 * 최상위가 객체인 JSON — 모든 depth가 JsonValue로 재귀 타이핑됨.
 * 예: `{ "user": { "name": "Alice", "scores": [1, 2, 3] }, "active": true }`
 */
export type JsonObject = { [key: string]: JsonValue };

// ---------------------------------------------------------------------------
// flatten — 핵심 함수
// ---------------------------------------------------------------------------

/**
 * 중첩된 객체를 dot-notation 키-값 쌍으로 평탄화합니다.
 *
 * @param obj - 평탄화할 객체. JSON 문자열(`string`) 또는 파싱된 객체(`JsonObject`)를 받습니다.
 *              문자열 입력 시 내부에서 `JSON.parse` 후 처리합니다.
 * @returns `{ "a.b.c": value, "d": value }` 형태의 평탄화 결과
 *
 * @example
 * flatten({ a: { b: { c: 1 } }, d: 2 })
 * // → { "a.b.c": 1, "d": 2 }
 *
 * flatten('{"a":{"b":1}}')
 * // → { "a.b": 1 }
 */
export function flatten(obj: string | JsonObject): JsonObject {
  const source: JsonObject = typeof obj === "string" ? JSON.parse(obj) : obj;

  const result: JsonObject = {};

  function walk(value: JsonValue, prefix: string) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      result[prefix] = value;
      return;
    }

    for (const [key, val] of Object.entries(value)) {
      const path = prefix ? `${prefix}.${key}` : key;
      walk(val, path);
    }
  }

  walk(source, "");
  return result;
}

// ---------------------------------------------------------------------------
// MCP Tool 정의
// ---------------------------------------------------------------------------

export const tools = {
  objectFlattenTool: toolDef({
    name: "object_flatten",
    description:
      "Flattens a nested JSON object of any depth into dot-notation key-value pairs. " +
      "Accepts a JSON string and recursively flattens all levels. " +
      "Arrays and primitives at any level are treated as leaf values.",
    inputSchema: {
      json: z
        .union([z.string(), z.record(z.string(), z.any())])
        .describe("JSON string or parsed object to flatten (unlimited depth)"),
    },
    handler: async ({ json }) => {
      try {
        const input: string | JsonObject =
          typeof json === "string" ? json : (json as JsonObject);
        const result = flatten(input);
        return text(JSON.stringify(result, null, 2));
      } catch (err) {
        if (err instanceof SyntaxError) {
          return text("Error: invalid JSON string — unable to parse input");
        }
        return text(`Error: failed to flatten object — ${(err as Error).message}`);
      }
    },
    examples: [
      {
        args: [`'{"user":{"name":"Alice","address":{"city":"Seoul","zip":"12345"}},"active":true}'`],
        result: JSON.stringify(
          {
            "user.name": "Alice",
            "user.address.city": "Seoul",
            "user.address.zip": "12345",
            active: true,
          },
          null,
          2,
        ),
      },
      {
        args: [`'{"a":{"b":{"c":{"d":{"e":"deep"}}}}}'`],
        result: JSON.stringify({ "a.b.c.d.e": "deep" }, null, 2),
      },
    ],
    guidelines: [
      "Arrays and primitives at any level are always treated as leaf values — they are never traversed.",
      "The result is always a flat JSON object with dot-notation keys.",
      "There is no depth limit — objects of any nesting level are fully flattened.",
      "Input is accepted as a JSON string (MCP/CLI) and parsed internally.",
    ],
  }),
};

export const objectFlattenTool = defineTool(tools.objectFlattenTool);
