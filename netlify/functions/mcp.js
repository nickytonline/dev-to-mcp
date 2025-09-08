import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import pino from "pino";
const configSchema = z.object({
  PORT: z.coerce.number().default(3e3),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  SERVER_NAME: z.string().default("dev-to-mcp"),
  SERVER_VERSION: z.string().default("1.0.0"),
  LOG_LEVEL: z.enum(["error", "warn", "info", "debug"]).default("info")
});
let config$2;
function getConfig() {
  if (!config$2) {
    try {
      config$2 = configSchema.parse(process.env);
    } catch (error) {
      console.error("❌ Invalid environment configuration:", error);
      process.exit(1);
    }
  }
  return config$2;
}
function isDevelopment() {
  return getConfig().NODE_ENV === "development";
}
const config$1 = getConfig();
const logger = pino({
  level: config$1.LOG_LEVEL,
  transport: isDevelopment() ? {
    target: "pino-pretty",
    options: {
      colorize: true,
      translateTime: "HH:MM:ss Z",
      ignore: "pid,hostname"
    }
  } : void 0,
  base: {
    service: config$1.SERVER_NAME,
    version: config$1.SERVER_VERSION,
    environment: config$1.NODE_ENV
  },
  formatters: {
    level: (label) => ({ level: label })
  }
});
class DevToAPI {
  #baseUrl;
  constructor(baseURL = "https://dev.to/api/") {
    const normalizedBaseURL = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
    this.#baseUrl = new URL(normalizedBaseURL);
  }
  async #makeRequest(url) {
    logger.debug({ url }, "Making API request");
    try {
      const response = await fetch(url);
      if (!response.ok) {
        logger.error(
          {
            url,
            status: response.status,
            statusText: response.statusText
          },
          "API request failed"
        );
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      logger.debug({ url, status: response.status }, "API request successful");
      return response.json();
    } catch (error) {
      logger.error({ url, error }, "API request error");
      throw error;
    }
  }
  async getArticles(args = {}) {
    const url = new URL("articles", this.#baseUrl);
    Object.entries(args).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return await this.#makeRequest(url);
  }
  async getArticle(args) {
    let endpoint;
    if (args.id) {
      if (!Number.isInteger(args.id) || args.id <= 0) {
        throw new Error("Article ID must be a positive integer");
      }
      endpoint = new URL(`articles/${args.id}`, this.#baseUrl);
    } else if (args.path) {
      endpoint = new URL(
        `articles/${encodeURIComponent(args.path)}`,
        this.#baseUrl
      );
    } else {
      throw new Error("Either id or path must be provided");
    }
    return await this.#makeRequest(endpoint);
  }
  async getUser(args) {
    let endpoint;
    if (args.id) {
      if (!Number.isInteger(args.id) || args.id <= 0) {
        throw new Error("User ID must be a positive integer");
      }
      endpoint = new URL(`users/${args.id}`, this.#baseUrl);
    } else if (args.username) {
      endpoint = new URL("users/by_username", this.#baseUrl);
      endpoint.searchParams.set("url", args.username);
    } else {
      throw new Error("Either id or username must be provided");
    }
    return await this.#makeRequest(endpoint);
  }
  async getTags(args = {}) {
    const url = new URL("tags", this.#baseUrl);
    Object.entries(args).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return await this.#makeRequest(url);
  }
  async getComments(args) {
    if (!Number.isInteger(args.article_id) || args.article_id <= 0) {
      throw new Error("Article ID must be a positive integer");
    }
    const url = new URL("comments", this.#baseUrl);
    url.searchParams.set("a_id", String(args.article_id));
    return await this.#makeRequest(url);
  }
  async searchArticles(args) {
    const url = new URL("search/feed_content", this.#baseUrl);
    Object.entries(args).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return await this.#makeRequest(url);
  }
}
function createTextResult(data) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(data, null, 2)
      }
    ]
  };
}
const transports = {};
const getServer = () => {
  const server = new McpServer({
    name: "dev-to-mcp",
    version: "1.0.0"
  });
  const devToAPI = new DevToAPI();
  server.registerTool(
    "get_articles",
    {
      title: "Get Articles",
      description: "Get articles from dev.to. Can filter by username, tag, or other parameters.",
      inputSchema: {
        username: z.string().optional().describe("Filter articles by username"),
        tag: z.string().optional().describe("Filter articles by tag"),
        top: z.number().optional().describe(
          "Number representing the number of days since publication for top articles (1, 7, 30, or infinity)"
        ),
        page: z.number().optional().default(1).describe("Pagination page number (default: 1)"),
        per_page: z.number().optional().default(30).describe("Number of articles per page (default: 30, max: 1000)"),
        state: z.enum(["fresh", "rising", "all"]).optional().describe("Filter by article state")
      }
    },
    async (args) => {
      logger.info({ args }, "Getting articles");
      try {
        const data = await devToAPI.getArticles(args);
        logger.debug({ articlesCount: Array.isArray(data) ? data.length : "unknown" }, "Articles retrieved");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to get articles");
        throw error;
      }
    }
  );
  server.registerTool(
    "get_article",
    {
      title: "Get Article",
      description: "Get a specific article by ID or path",
      inputSchema: {
        id: z.number().optional().describe("Article ID"),
        path: z.string().optional().describe('Article path (e.g., "username/article-slug")')
      }
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
    }
  );
  server.registerTool(
    "get_user",
    {
      title: "Get User",
      description: "Get user information by ID or username",
      inputSchema: {
        id: z.number().optional().describe("User ID"),
        username: z.string().optional().describe("Username")
      }
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
    }
  );
  server.registerTool(
    "get_tags",
    {
      title: "Get Tags",
      description: "Get popular tags from dev.to",
      inputSchema: {
        page: z.number().optional().default(1).describe("Pagination page number (default: 1)"),
        per_page: z.number().optional().default(10).describe("Number of tags per page (default: 10, max: 1000)")
      }
    },
    async (args) => {
      logger.info({ args }, "Getting tags");
      try {
        const data = await devToAPI.getTags(args);
        logger.debug({ tagsCount: Array.isArray(data) ? data.length : "unknown" }, "Tags retrieved");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to get tags");
        throw error;
      }
    }
  );
  server.registerTool(
    "get_comments",
    {
      title: "Get Comments",
      description: "Get comments for a specific article",
      inputSchema: {
        article_id: z.number().describe("Article ID to get comments for")
      }
    },
    async (args) => {
      logger.info({ args }, "Getting comments");
      try {
        const data = await devToAPI.getComments(args);
        logger.debug({ commentsCount: Array.isArray(data) ? data.length : "unknown" }, "Comments retrieved");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to get comments");
        throw error;
      }
    }
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
        search_fields: z.string().optional().describe(
          "Comma-separated list of fields to search (title, body_text, tag_list)"
        )
      }
    },
    async (args) => {
      logger.info({ args }, "Searching articles");
      try {
        const data = await devToAPI.searchArticles(args);
        logger.debug({ resultsCount: Array.isArray(data) ? data.length : "unknown" }, "Article search completed");
        return createTextResult(data);
      } catch (error) {
        logger.error({ error, args }, "Failed to search articles");
        throw error;
      }
    }
  );
  return server;
};
const mcp = async (req) => {
  try {
    const sessionId = req.headers.get("mcp-session-id");
    const body = await req.json();
    if (req.method === "POST" && !sessionId && isInitializeRequest(body)) {
      logger.info("Initializing new MCP session");
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId2) => {
          logger.info({ sessionId: sessionId2 }, "MCP session initialized");
          transports[sessionId2] = transport;
        }
      });
      const server = getServer();
      await server.connect(transport);
      return await transport.handleRequest(req, body);
    }
    if (sessionId && transports[sessionId]) {
      logger.debug({ sessionId }, "Handling request for existing session");
      const transport = transports[sessionId];
      return await transport.handleRequest(req, body);
    }
    if (req.method === "POST" && !sessionId) {
      logger.warn("POST request without session ID for non-initialization request");
      return new Response(
        JSON.stringify({ error: "Session ID required for non-initialization requests" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (sessionId && !transports[sessionId]) {
      logger.warn({ sessionId }, "Request for unknown session");
      return new Response(
        JSON.stringify({ error: "Session not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          name: "dev-to-mcp",
          version: "1.0.0",
          description: "MCP server for dev.to public API",
          capabilities: ["tools"]
        }),
        { headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response("Method not allowed", { status: 405 });
  } catch (error) {
    logger.error({ error }, "Netlify function error");
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
const config = {
  path: "/mcp"
};
export {
  config,
  mcp as default
};
