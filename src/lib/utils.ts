import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Creates a CallToolResult with text content from any data
 * @param data - The data to stringify and include in the result
 * @returns A properly formatted CallToolResult
 */
export function createTextResult(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}