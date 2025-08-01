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
  #baseUrl = "https://dev.to/api";

  async #makeRequest(endpoint: string): Promise<unknown> {
    const url = `${this.#baseUrl}${endpoint}`;
    logger.debug({ url }, "Making API request");
    
    try {
      const response = await fetch(url);

      if (!response.ok) {
        logger.error({ 
          url, 
          status: response.status, 
          statusText: response.statusText 
        }, "API request failed");
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug({ url, status: response.status }, "API request successful");
      return response.json();
    } catch (error) {
      logger.error({ url, error }, "API request error");
      throw error;
    }
  }

  #buildQueryString(params: GetArticlesArgs): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  async getArticles(args: GetArticlesArgs = {}): Promise<unknown> {
    const queryString = this.#buildQueryString(args);
    return await this.#makeRequest(`/articles${queryString}`);
  }

  async getArticle(args: {
    id?: number;
    path?: string;
  }): Promise<unknown> {
    let endpoint: string;

    if (args.id) {
      endpoint = `/articles/${args.id}`;
    } else if (args.path) {
      endpoint = `/articles/${args.path}`;
    } else {
      throw new Error("Either id or path must be provided");
    }

    return await this.#makeRequest(endpoint);
  }

  async getUser(args: {
    id?: number;
    username?: string;
  }): Promise<unknown> {
    let endpoint: string;

    if (args.id) {
      endpoint = `/users/${args.id}`;
    } else if (args.username) {
      endpoint = `/users/by_username?url=${args.username}`;
    } else {
      throw new Error("Either id or username must be provided");
    }

    return await this.#makeRequest(endpoint);
  }

  async getTags(
    args: { page?: number; per_page?: number } = {},
  ): Promise<unknown> {
    const queryString = this.#buildQueryString(args);
    return await this.#makeRequest(`/tags${queryString}`);
  }

  async getComments(args: { article_id: number }): Promise<unknown> {
    return await this.#makeRequest(`/comments?a_id=${args.article_id}`);
  }

  async searchArticles(args: {
    q: string;
    page?: number;
    per_page?: number;
    search_fields?: string;
  }): Promise<unknown> {
    const queryString = this.#buildQueryString(args);
    return await this.#makeRequest(`/search/feed_content${queryString}`);
  }
}
