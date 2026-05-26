import { tools as textTools } from "./text.js";
import { tools as deepTools } from "./deep.js";

export { cnTool, caseConvertTool, truncateTool } from "./text.js";
export { objectFlattenTool } from "./deep.js";

export const tools = { ...textTools, ...deepTools };
