import { defineTool, toolDef, text } from "@common";
import { z } from "zod";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RandomUser {
  gender: "male" | "female";
  name: {
    title: string;
    first: string;
    last: string;
  };
  location: {
    street: {
      number: number;
      name: string;
    };
    city: string;
    state: string;
    country: string;
    postcode: string | number;
    coordinates: {
      latitude: string;
      longitude: string;
    };
    timezone: {
      offset: string;
      description: string;
    };
  };
  email: string;
  login: {
    uuid: string;
    username: string;
  };
  dob: {
    date: string;
    age: number;
  };
  phone: string;
  cell: string;
  picture: {
    large: string;
    medium: string;
    thumbnail: string;
  };
  nat: string;
}

// ---------------------------------------------------------------------------
// getUser — 핵심 함수
// ---------------------------------------------------------------------------

/**
 * RandomUser 객체에서 이름과 거주 도시를 추출하여 문장을 반환합니다.
 *
 * @param user - RandomUser 타입의 사용자 객체 (직접 전달) 또는 JSON 문자열
 * @returns `이름은 {first} {last} 이고 현재 {city} 에 살고 있습니다.`
 *
 * @example
 * getUser({ name: { first: "Alice", last: "Kim" }, location: { city: "Seoul" } } as RandomUser)
 * // → "이름은 Alice Kim 이고 현재 Seoul 에 살고 있습니다."
 */
export function getUser(user: string | RandomUser): string {
  const parsed: RandomUser =
    typeof user === "string" ? JSON.parse(user) : user;

  const { first, last } = parsed.name;
  const city = parsed.location.city;

  return `이름은 ${first} ${last} 이고 현재 ${city} 에 살고 있습니다.`;
}

// ---------------------------------------------------------------------------
// MCP Tool 정의
// ---------------------------------------------------------------------------

export const tools = {
  getUserTool: toolDef({
    name: "getUser",
    description:
      "RandomUser API 형식의 사용자 객체를 받아 이름과 거주 도시로 구성된 한글 문장을 반환합니다. " +
      "JSON 문자열 또는 파싱된 객체를 입력받습니다.",
    inputSchema: {
      user: z
        .union([z.string(), z.record(z.string(), z.any())])
        .describe("RandomUser 형식의 JSON 문자열 또는 객체 — name.first / name.last / location.city 필수"),
    },
    typeLabels: {
      user: "RandomUser",
    },
    typeDefs: {
      user: [
        "interface RandomUser {",
        '  gender: "male" | "female";',
        "  name: {",
        "    title: string;",
        "    first: string;",
        "    last: string;",
        "  };",
        "  location: {",
        "    street: {",
        "      number: number;",
        "      name: string;",
        "    };",
        "    city: string;",
        "    state: string;",
        "    country: string;",
        "    postcode: string | number;",
        "    coordinates: {",
        "      latitude: string;",
        "      longitude: string;",
        "    };",
        "    timezone: {",
        "      offset: string;",
        "      description: string;",
        "    };",
        "  };",
        "  email: string;",
        "  login: {",
        "    uuid: string;",
        "    username: string;",
        "  };",
        "  dob: {",
        "    date: string;",
        "    age: number;",
        "  };",
        "  phone: string;",
        "  cell: string;",
        "  picture: {",
        "    large: string;",
        "    medium: string;",
        "    thumbnail: string;",
        "  };",
        "  nat: string;",
        "}",
      ].join("\n"),
    },
    handler: async ({ user }) => {
      try {
        const input: string | RandomUser =
          typeof user === "string" ? user : (user as RandomUser);
        const result = getUser(input);
        return text(result);
      } catch (err) {
        if (err instanceof SyntaxError) {
          return text("Error: invalid JSON string — unable to parse input");
        }
        return text(
          `Error: failed to process user data — ${(err as Error).message}` +
            "\n\nInput must include `name.first`, `name.last`, and `location.city`.",
        );
      }
    },
    examples: [
      {
        args: [
          `'{"name":{"title":"Mr","first":"Alice","last":"Kim"},"location":{"city":"Seoul"},"gender":"female","email":"alice@example.com","nat":"KR"}'`,
        ],
        result: "이름은 Alice Kim 이고 현재 Seoul 에 살고 있습니다.",
      },
    ],
    guidelines: [
      "입력은 RandomUser API 스펙을 따릅니다. 최소한 name.first, name.last, location.city 필드가 필요합니다.",
      "JSON 문자열(string)과 파싱된 객체 모두 허용됩니다 (CLI / MCP 모두 동작).",
      "결과는 항상 '이름은 {first} {last} 이고 현재 {city} 에 살고 있습니다.' 형식의 한글 문장입니다.",
    ],
  }),
};

export const getUserTool = defineTool(tools.getUserTool);
