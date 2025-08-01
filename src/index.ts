import express from "express";
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { DevToAPI } from "./devto-api.ts";
import { createTextResult } from "./lib/utils.ts";
import { logger } from "./logger.ts";
import { getConfig } from "./config.ts";

const getServer = () => {
  const server = new McpServer({
    name: "dev-to-mcp",
    version: "1.0.0",
  });

  const devToAPI = new DevToAPI();

  server.registerTool(
    "get_articles",
    {
      title: "Get Articles",
      description:
        "Get articles from dev.to. Can filter by username, tag, or other parameters.",
      inputSchema: {
        username: z.string().optional().describe("Filter articles by username"),
        tag: z.string().optional().describe("Filter articles by tag"),
        top: z
          .number()
          .optional()
          .describe(
            "Number representing the number of days since publication for top articles (1, 7, 30, or infinity)",
          ),
        page: z
          .number()
          .optional()
          .default(1)
          .describe("Pagination page number (default: 1)"),
        per_page: z
          .number()
          .optional()
          .default(30)
          .describe("Number of articles per page (default: 30, max: 1000)"),
        state: z
          .enum(["fresh", "rising", "all"])
          .optional()
          .describe("Filter by article state"),
      },
    },
    async (args) => {
      logger.info({ args }, "Getting articles");
      try {
        const data = await devToAPI.getArticles(args);
        logger.debug({ articlesCount: Array.isArray(data) ? data.length : 'unknown' }, "Articles retrieved");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to get articles");
        throw error;
      }
    },
  );

  server.registerTool(
    "get_article",
    {
      title: "Get Article",
      description: "Get a specific article by ID or path",
      inputSchema: {
        id: z.number().optional().describe("Article ID"),
        path: z
          .string()
          .optional()
          .describe('Article path (e.g., "username/article-slug")'),
      },
    },
    async (args) => {
      logger.info({ args }, "Getting article");
      if (!args.id && !args.path) {
        logger.error({ args }, "Neither id nor path provided for get_article");
        throw new Error("Either id or path must be provided");
      }
      try {
        const data = await devToAPI.getArticle(args);
        logger.debug({ articleId: args.id, articlePath: args.path }, "Article retrieved");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to get article");
        throw error;
      }
    },
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
      logger.info({ args }, "Getting user");
      if (!args.id && !args.username) {
        logger.error({ args }, "Neither id nor username provided for get_user");
        throw new Error("Either id or username must be provided");
      }
      try {
        const data = await devToAPI.getUser(args);
        logger.debug({ userId: args.id, username: args.username }, "User retrieved");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to get user");
        throw error;
      }
    },
  );

  server.registerTool(
    "get_tags",
    {
      title: "Get Tags",
      description: "Get popular tags from dev.to",
      inputSchema: {
        page: z
          .number()
          .optional()
          .default(1)
          .describe("Pagination page number (default: 1)"),
        per_page: z
          .number()
          .optional()
          .default(10)
          .describe("Number of tags per page (default: 10, max: 1000)"),
      },
    },
    async (args) => {
      logger.info({ args }, "Getting tags");
      try {
        const data = await devToAPI.getTags(args);
        logger.debug({ tagsCount: Array.isArray(data) ? data.length : 'unknown' }, "Tags retrieved");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to get tags");
        throw error;
      }
    },
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
    async (args) => {
      logger.info({ args }, "Getting comments");
      try {
        const data = await devToAPI.getComments(args);
        logger.debug({ commentsCount: Array.isArray(data) ? data.length : 'unknown' }, "Comments retrieved");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to get comments");
        throw error;
      }
    },
  );

  server.registerTool(
    "search_articles",
    {
      title: "Search Articles",
      description: "Search articles using query parameters",
      inputSchema: {
        q: z.string().describe("Search query"),
        page: z
          .number()
          .optional()
          .default(1)
          .describe("Pagination page number (default: 1)"),
        per_page: z
          .number()
          .optional()
          .default(30)
          .describe("Number of articles per page (default: 30, max: 1000)"),
        search_fields: z
          .string()
          .optional()
          .describe(
            "Comma-separated list of fields to search (title, body_text, tag_list)",
          ),
      },
    },
    async (args) => {
      logger.info({ args }, "Searching articles");
      try {
        const data = await devToAPI.searchArticles(args);
        logger.debug({ resultsCount: Array.isArray(data) ? data.length : 'unknown' }, "Article search completed");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to search articles");
        throw error;
      }
    },
  );

  return server;
};

const app = express();
app.use(express.json());

const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

const mcpHandler = async (req: express.Request, res: express.Response) => {
  const sessionId = req.headers["mcp-session-id"] as string | undefined;

  if (req.method === "POST" && !sessionId && isInitializeRequest(req.body)) {
    logger.info("Initializing new MCP session");
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        logger.info({ sessionId }, "MCP session initialized");
        transports[sessionId] = transport;
      },
    });

    const server = getServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    return;
  }

  if (sessionId && transports[sessionId]) {
    logger.debug({ sessionId }, "Handling request for existing session");
    const transport = transports[sessionId];
    await transport.handleRequest(req, res, req.body);
    return;
  }

  if (req.method === "POST" && !sessionId) {
    logger.warn("POST request without session ID for non-initialization request");
    res
      .status(400)
      .json({ error: "Session ID required for non-initialization requests" });
    return;
  }

  if (sessionId && !transports[sessionId]) {
    logger.warn({ sessionId }, "Request for unknown session");
    res.status(404).json({ error: "Session not found" });
    return;
  }
  if (req.method === "GET") {
    res.json({
      name: "dev-to-mcp",
      version: "1.0.0",
      description: "MCP server for dev.to public API",
      capabilities: ["tools"],
    });
  }
};

app.post("/mcp", mcpHandler);
app.get("/mcp", mcpHandler);

async function main() {
  const config = getConfig();
  const port = config.PORT;

  app.listen(port, () => {
    logger.info({ port, environment: config.NODE_ENV }, "Dev.to MCP Server started");
  });
}

main().catch((error) => {
  logger.error({ error }, "Server startup failed");
  process.exit(1);
});
