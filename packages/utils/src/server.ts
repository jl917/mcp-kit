import { createMcpServer, startServer } from "@common";
import { cnTool, caseConvertTool, truncateTool, objectFlattenTool } from "./tools/index.js";

const server = createMcpServer({ name: "mono-rele2-utils", version: "1.0.0" }, [cnTool, caseConvertTool, truncateTool, objectFlattenTool]);

startServer(server).catch((err) => {
  console.error("[utils] server error:", err);
  process.exit(1);
});
