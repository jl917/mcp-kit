import { defineTool, toolDef, text } from "@common";
import { z } from "zod";
import { cn } from "../cn.js";

export const tools = {
  cnTool: toolDef({
    name: "cn",
    description: "Merges class names, filtering out falsy values",
    inputSchema: {
      classes: z.array(z.string()).describe("List of class names to merge"),
    },
    typeLabels: { classes: "string[]" },
    returnType: "string",
    returnDescription: "Merged class name string with falsy values filtered out",
    handler: async ({ classes }) => text(cn(...classes)),
    examples: [{ args: [`'["btn","active","large"]'`], result: "btn active large" }],
  }),
  caseConvertTool: toolDef({
    name: "case_convert",
    description: "Converts text to the specified case format",
    inputSchema: {
      input: z.string().describe("Text to convert"),
      to: z.enum(["upper", "lower", "capitalize", "camel", "snake", "kebab"]).describe("Target case format"),
    },
    typeLabels: {
      input: "string",
      to: '"upper" | "lower" | "capitalize" | "camel" | "snake" | "kebab"',
    },
    returnType: "string",
    returnDescription: "Converted text in the target case format",
    handler: async ({ input, to }) => text(convert(input, to)),
    examples: [
      { args: [`"hello world"`, "camel"], result: "helloWorld" },
      { args: [`"helloWorld"`, "snake"], result: "hello_world" },
      { args: [`"hello world"`, "kebab"], result: "hello-world" },
    ],
  }),
  truncateTool: toolDef({
    name: "truncate",
    description: "Truncates text to a maximum length and appends a suffix",
    inputSchema: {
      input: z.string().describe("Text to truncate"),
      maxLength: z.number().int().positive().describe("Maximum character length"),
      suffix: z.string().default("...").describe("Suffix to append when truncated"),
    },
    typeLabels: {
      input: "string",
      maxLength: "number",
      suffix: "string",
    },
    returnType: "string",
    returnDescription: "Truncated text with the configured suffix appended if truncated",
    handler: async ({ input, maxLength, suffix }) => {
      const result = input.length <= maxLength ? input : input.slice(0, maxLength - suffix.length) + suffix;
      return text(result);
    },
    examples: [
      { args: [`"hello world long text"`, "10"], result: "hello w..." },
      { args: [`"hello world"`, "8", `"…"`], result: "hello w…" },
    ],
  }),
};

export const cnTool = defineTool(tools.cnTool);
export const caseConvertTool = defineTool(tools.caseConvertTool);
export const truncateTool = defineTool(tools.truncateTool);

function convert(input: string, to: "upper" | "lower" | "capitalize" | "camel" | "snake" | "kebab"): string {
  switch (to) {
    case "upper":
      return input.toUpperCase();
    case "lower":
      return input.toLowerCase();
    case "capitalize":
      return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
    case "camel":
      return input.replace(/[-_\s]+(.)/g, (_, c: string) => c.toUpperCase()).replace(/^(.)/, (c) => c.toLowerCase());
    case "snake":
      return input
        .replace(/([A-Z])/g, "_$1")
        .replace(/[-\s]+/g, "_")
        .toLowerCase()
        .replace(/^_/, "");
    case "kebab":
      return input
        .replace(/([A-Z])/g, "-$1")
        .replace(/[_\s]+/g, "-")
        .toLowerCase()
        .replace(/^-/, "");
  }
}
