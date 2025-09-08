import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "netlify/functions/mcp.ts"),
      name: "NetlifyMCP",
      fileName: "mcp",
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        "@modelcontextprotocol/sdk",
        "@modelcontextprotocol/sdk/server/mcp.js",
        "@modelcontextprotocol/sdk/server/streamableHttp.js",
        "@modelcontextprotocol/sdk/types.js",
        "zod",
        "node:crypto",
        "node:http",
        "node:path",
        "node:fs",
        "node:url",
        "node:buffer",
        "node:stream",
        "node:events",
        "node:util",
        "pino",
        "pino-pretty",
      ],
      output: {
        format: "es",
      },
    },
    target: "node18",
    outDir: "netlify/functions",
    emptyOutDir: false,
    ssr: true,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  ssr: {
    external: [
      "@modelcontextprotocol/sdk",
      "zod", 
      "pino",
      "pino-pretty"
    ],
  },
});