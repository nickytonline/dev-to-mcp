import { describe, it, expect, vi, beforeEach } from "vitest";
import { DevToAPI } from "./devto-api.ts";

// Mock fetch globally
global.fetch = vi.fn();

describe("DevToAPI", () => {
  let api: DevToAPI;

  beforeEach(() => {
    api = new DevToAPI();
    vi.clearAllMocks();
  });

  describe("getArticles", () => {
    it("should construct correct URL for username filtering", async () => {
      const mockArticles = [
        {
          id: 1,
          title: "Test Article",
          published_at: "2024-01-01T00:00:00Z",
          url: "https://dev.to/nickytonline/test-article",
          description: "A test article"
        }
      ];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockArticles,
      } as Response);

      const result = await api.getArticles({ 
        username: "nickytonline", 
        per_page: 5 
      });

      // Verify the correct URL was called
      expect(fetch).toHaveBeenCalledWith(
        new URL("https://dev.to/api/articles?username=nickytonline&per_page=5")
      );
      
      expect(result).toEqual(mockArticles);
    });

    it("should handle empty username parameter", async () => {
      const mockArticles = [];

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockArticles,
      } as Response);

      const result = await api.getArticles({ username: "nonexistentuser" });

      expect(fetch).toHaveBeenCalledWith(
        new URL("https://dev.to/api/articles?username=nonexistentuser")
      );
      
      expect(result).toEqual(mockArticles);
    });

    it("should handle API errors gracefully", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: "Not Found",
      } as Response);

      await expect(api.getArticles({ username: "nickytonline" }))
        .rejects
        .toThrow("HTTP 404: Not Found");
    });
  });
});