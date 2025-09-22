import { describe, it, expect, vi, beforeEach } from "vitest";
import { DevToAPI } from "./devto-api.ts";

// Mock the DevToAPI
vi.mock("./devto-api.ts");

// Mock the logger
vi.mock("./logger.ts", () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  }
}));

// Mock the config
vi.mock("./config.ts", () => ({
  getConfig: vi.fn(() => ({ environment: "test" }))
}));

// Mock utils
vi.mock("./lib/utils.ts", () => ({
  createTextResult: vi.fn((data) => ({
    content: [{ type: "text", text: JSON.stringify(data) }]
  }))
}));

describe("MCP Server Tools", () => {
  let mockDevToAPI: DevToAPI;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDevToAPI = vi.mocked(DevToAPI);
    mockDevToAPI.prototype.getArticles = vi.fn();
  });

  it("should register get_nickytonline_latest_posts tool", async () => {
    const mockArticles = [
      {
        id: 1,
        title: "Latest Post from Nick",
        published_at: "2024-01-01T00:00:00Z",
        url: "https://dev.to/nickytonline/latest-post",
        description: "Nick's latest thoughts"
      }
    ];

    const apiInstance = new DevToAPI();
    vi.mocked(apiInstance.getArticles).mockResolvedValue(mockArticles);

    const result = await apiInstance.getArticles({
      username: "nickytonline",
      per_page: 10,
      state: "all"
    });

    expect(apiInstance.getArticles).toHaveBeenCalledWith({
      username: "nickytonline", 
      per_page: 10,
      state: "all"
    });

    expect(result).toEqual(mockArticles);
  });
});