import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { DevToAPI } from "./devto-api.js";

const getServer = () => {
  const server = new McpServer(
    {
      name: "dev-to-mcp",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );

  const devToAPI = new DevToAPI();

  server.registerTool(
    "get_articles",
    {
      title: "Get Articles",
      description: "Get articles from dev.to. Can filter by username, tag, or other parameters.",
      inputSchema: {
        username: z.string().optional().describe("Filter articles by username"),
        tag: z.string().optional().describe("Filter articles by tag"),
        top: z.number().optional().describe("Number representing the number of days since publication for top articles (1, 7, 30, or infinity)"),
        page: z.number().optional().default(1).describe("Pagination page number (default: 1)"),
        per_page: z.number().optional().default(30).describe("Number of articles per page (default: 30, max: 1000)"),
        state: z.enum(["fresh", "rising", "all"]).optional().describe("Filter by article state"),
      },
    },
    async (args) => await devToAPI.getArticles(args)
  );

  server.registerTool(
    "get_article",
    {
      title: "Get Article",
      description: "Get a specific article by ID or path",
      inputSchema: {
        id: z.number().optional().describe("Article ID"),
        path: z.string().optional().describe('Article path (e.g., "username/article-slug")'),
      },
    },
    async (args) => {
      if (!args.id && !args.path) {
        throw new Error("Either id or path must be provided");
      }
      return await devToAPI.getArticle(args);
    }
  );

  server.registerTool(
    "get_user",
    {
      title: "Get User",
      description: "Get user information by ID or username",
      inputSchema: {
        id: z.number().optional().describe("User ID"),
        username: z.string().optional().describe("Username"),
      },
    },
    async (args) => {
      if (!args.id && !args.username) {
        throw new Error("Either id or username must be provided");
      }
      return await devToAPI.getUser(args);
    }
  );

  server.registerTool(
    "get_tags",
    {
      title: "Get Tags",
      description: "Get popular tags from dev.to",
      inputSchema: {
        page: z.number().optional().default(1).describe("Pagination page number (default: 1)"),
        per_page: z.number().optional().default(10).describe("Number of tags per page (default: 10, max: 1000)"),
      },
    },
    async (args) => await devToAPI.getTags(args)
  );

  server.registerTool(
    "get_comments",
    {
      title: "Get Comments",
      description: "Get comments for a specific article",
      inputSchema: {
        article_id: z.number().describe("Article ID to get comments for"),
      },
    },
    async (args) => await devToAPI.getComments(args)
  );

  server.registerTool(
    "search_articles",
    {
      title: "Search Articles",
      description: "Search articles using query parameters",
      inputSchema: {
        q: z.string().describe("Search query"),
        page: z.number().optional().default(1).describe("Pagination page number (default: 1)"),
        per_page: z.number().optional().default(30).describe("Number of articles per page (default: 30, max: 1000)"),
        search_fields: z.string().optional().describe("Comma-separated list of fields to search (title, body_text, tag_list)"),
      },
    },
    async (args) => await devToAPI.searchArticles(args)
  );

  return server;
};

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

export default function createApp() {
  const app = express();
  app.use(express.json());

  const mcpHandler = async (req: express.Request, res: express.Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Handle initialization requests (usually POST without session ID)
    if (req.method === "POST" && (!sessionId && isInitializeRequest(req.body))) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId] = transport;
        },
      });

      const server = getServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Handle existing session requests
    if (sessionId && transports[sessionId]) {
      const transport = transports[sessionId];
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Handle case where no session ID is provided for non-init requests
    if (req.method === "POST" && !sessionId) {
      res.status(400).json({ error: "Session ID required for non-initialization requests" });
      return;
    }

    // Handle unknown session
    if (sessionId && !transports[sessionId]) {
      res.status(404).json({ error: "Session not found" });
      return;
    }

    // For GET requests without session, return server info
    if (req.method === "GET") {
      res.json({ 
        name: "dev-to-mcp",
        version: "1.0.0",
        description: "MCP server for dev.to public API",
        capabilities: ["tools"]
      });
    }
  };

  // Handle MCP requests
  app.post("/", mcpHandler);
  app.get("/", mcpHandler);

  return app;
}