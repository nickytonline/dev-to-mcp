export class DevToAPI {
  #baseUrl = "https://dev.to/api";

  async #makeRequest(endpoint: string): Promise<any> {
    const response = await fetch(`${this.#baseUrl}${endpoint}`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  #buildQueryString(params: Record<string, any>): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const queryString = searchParams.toString();
    return queryString ? `?${queryString}` : "";
  }

  async getArticles(args: any = {}) {
    const queryString = this.#buildQueryString(args);
    const data = await this.#makeRequest(`/articles${queryString}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getArticle(args: { id?: number; path?: string }) {
    let endpoint: string;

    if (args.id) {
      endpoint = `/articles/${args.id}`;
    } else if (args.path) {
      endpoint = `/articles/${args.path}`;
    } else {
      throw new Error("Either id or path must be provided");
    }

    const data = await this.#makeRequest(endpoint);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getUser(args: { id?: number; username?: string }) {
    let endpoint: string;

    if (args.id) {
      endpoint = `/users/${args.id}`;
    } else if (args.username) {
      endpoint = `/users/by_username?url=${args.username}`;
    } else {
      throw new Error("Either id or username must be provided");
    }

    const data = await this.#makeRequest(endpoint);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getTags(args: { page?: number; per_page?: number } = {}) {
    const queryString = this.#buildQueryString(args);
    const data = await this.#makeRequest(`/tags${queryString}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async getComments(args: { article_id: number }) {
    const data = await this.#makeRequest(`/comments?a_id=${args.article_id}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  async searchArticles(args: {
    q: string;
    page?: number;
    per_page?: number;
    search_fields?: string;
  }) {
    const queryString = this.#buildQueryString(args);
    const data = await this.#makeRequest(`/search/feed_content${queryString}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }
}
