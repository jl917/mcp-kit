import { defineTool, toolDef, text } from "@common";
import { z } from "zod";

/**
 * Recursively flattens a nested object into dot-notation keys.
 * Arrays and primitives at any level are treated as leaf values.
 */
function flatten(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  function walk(value: unknown, prefix: string) {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      result[prefix] = value;
      return;
    }

    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${key}` : key;
      walk(val, path);
    }
  }

  walk(obj, "");
  return result;
}

export const tools = {
  objectFlattenTool: toolDef({
    name: "object_flatten",
    description:
      "Flattens a nested JSON object of any depth into dot-notation key-value pairs. " +
      "Accepts a JSON string and recursively flattens all levels. " +
      "Arrays and primitives at any level are treated as leaf values.",
    inputSchema: {
      json: z.string().describe("JSON string of a nested object to flatten (unlimited depth)"),
    },
    handler: async ({ json }) => {
      let obj: Record<string, unknown>;
      try {
        const parsed = JSON.parse(json);
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          return text(`Error: input must be a JSON object, got ${Array.isArray(parsed) ? "array" : typeof parsed}`);
        }
        obj = parsed as Record<string, unknown>;
      } catch {
        return text("Error: invalid JSON string — unable to parse input");
      }

      try {
        const result = flatten(obj);
        return text(JSON.stringify(result, null, 2));
      } catch (err) {
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
    ],
  }),
};

export const objectFlattenTool = defineTool(tools.objectFlattenTool);
