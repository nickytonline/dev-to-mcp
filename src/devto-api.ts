import { logger } from "./logger.ts";

interface GetArticlesArgs {
  username?: string;
  tag?: string;
  tags?: string;
  tags_exclude?: string;
  state?: "fresh" | "rising" | "all";
  top?: number;
  page?: number;
  per_page?: number;
  collection_id?: number;
}

export class DevToAPI {
  #baseUrl: URL;

  constructor(baseURL = "https://dev.to/api/") {
    // Ensure the base URL ends with a slash for proper relative URL construction
    const normalizedBaseURL = baseURL.endsWith("/") ? baseURL : `${baseURL}/`;
    this.#baseUrl = new URL(normalizedBaseURL);
  }

  async #makeRequest(url: URL): Promise<unknown> {
    logger.debug({ url }, "Making API request");

    try {
      const response = await fetch(url);

      if (!response.ok) {
        logger.error(
          {
            url,
            status: response.status,
            statusText: response.statusText,
          },
          "API request failed",
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

  async getArticles(args: GetArticlesArgs = {}): Promise<unknown> {
    const url = new URL("articles", this.#baseUrl);
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return await this.#makeRequest(url);
  }

  async getArticle(args: { id?: number; path?: string }): Promise<unknown> {
    let endpoint: URL;

    if (args.id) {
      // Validate ID is a positive integer
      if (!Number.isInteger(args.id) || args.id <= 0) {
        throw new Error("Article ID must be a positive integer");
      }
      endpoint = new URL(
        `articles/${encodeURIComponent(args.id)}`,
        this.#baseUrl,
      );
    } else if (args.path) {
      // Sanitize path parameter
      endpoint = new URL(
        `articles/${encodeURIComponent(args.path)}`,
        this.#baseUrl,
      );
    } else {
      throw new Error("Either id or path must be provided");
    }

    return await this.#makeRequest(endpoint);
  }

  async getUser(args: { id?: number; username?: string }): Promise<unknown> {
    let endpoint: URL;

    if (args.id) {
      // Validate ID is a positive integer
      if (!Number.isInteger(args.id) || args.id <= 0) {
        throw new Error("User ID must be a positive integer");
      }
      endpoint = new URL(`users/${encodeURIComponent(args.id)}`, this.#baseUrl);
    } else if (args.username) {
      endpoint = new URL("users/by_username", this.#baseUrl);
      endpoint.searchParams.set("url", args.username);
    } else {
      throw new Error("Either id or username must be provided");
    }

    return await this.#makeRequest(endpoint);
  }

  async getTags(
    args: { page?: number; per_page?: number } = {},
  ): Promise<unknown> {
    const url = new URL("tags", this.#baseUrl);
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return await this.#makeRequest(url);
  }

  async getComments(args: { article_id: number }): Promise<unknown> {
    // Validate article_id is a positive integer
    if (!Number.isInteger(args.article_id) || args.article_id <= 0) {
      throw new Error("Article ID must be a positive integer");
    }

    const url = new URL("comments", this.#baseUrl);
    url.searchParams.set("a_id", String(args.article_id));
    return await this.#makeRequest(url);
  }

  async searchArticles(args: {
    q: string;
    page?: number;
    per_page?: number;
    search_fields?: string;
  }): Promise<unknown> {
    const url = new URL("search/feed_content", this.#baseUrl);
    Object.entries(args).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return await this.#makeRequest(url);
  }
}
