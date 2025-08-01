import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/**
 * Creates a CallToolResult with a text content block containing the JSON stringified data.
 * @param data - The data to be included in the text content block.
 * @returns A CallToolResult object with the text content block.
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
