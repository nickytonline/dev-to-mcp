import { describe, it, expect } from "vitest";
import { createTextResult } from "./utils.ts";

describe("createTextResult", () => {
  const mockUser = {
    type_of: "user",
    id: 9597,
    username: "nickytonline",
    name: "Nick Taylor",
    twitter_username: null,
    github_username: "nickytonline",
    summary: "I'm a fan of Open Source and have a growing interest in serverless and edge computing.",
    location: "Montréal, Québec, Canada",
    website_url: "https://OneTipAWeek.com",
    joined_at: "Mar 11, 2017"
  };

  const mockArticle = {
    type_of: "article",
    id: 2729716,
    title: "Introducing the dev.to MCP server",
    description: "If you've been wondering how to get your AI tools talking to dev.to's content...",
    slug: "introducing-the-devto-mcp-server-42jg",
    path: "/nickytonline/introducing-the-devto-mcp-server-42jg",
    comments_count: 16,
    public_reactions_count: 62,
    tag_list: ["mcp", "agenticai", "devto", "ai"],
    user: {
      name: "Nick Taylor",
      username: "nickytonline",
      user_id: 9597
    }
  };

  const mockTag = {
    id: 6,
    name: "react",
    bg_color_hex: "#61dafb",
    text_color_hex: "#000000",
    short_summary: "A JavaScript library for building user interfaces"
  };

  it("should create a CallToolResult with correct structure", () => {
    const result = createTextResult(mockUser);

    expect(result).toHaveProperty("content");
    expect(result.content).toHaveLength(1);
    expect(result.content[0]).toHaveProperty("type", "text");
    expect(result.content[0]).toHaveProperty("text");
    expect(typeof result.content[0].text).toBe("string");
  });

  it("should handle user data from dev.to API", () => {
    const result = createTextResult(mockUser);

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain('"username": "nickytonline"');
    expect(result.content[0].text).toContain('"name": "Nick Taylor"');
  });

  it("should handle article data from dev.to API", () => {
    const result = createTextResult(mockArticle);

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain('"title": "Introducing the dev.to MCP server"');
    expect(result.content[0].text).toContain('"tag_list"');
  });

  it("should handle tag data from dev.to API", () => {
    const result = createTextResult(mockTag);

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain('"name": "react"');
    expect(result.content[0].text).toContain('"bg_color_hex"');
  });

  it("should handle null data", () => {
    const result = createTextResult(null);

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toBe("null");
  });

  it("should handle array of articles", () => {
    const articles = [mockArticle, { ...mockArticle, id: 123456 }];
    const result = createTextResult(articles);

    expect(result.content[0].type).toBe("text");
    expect(result.content[0].text).toContain("2729716");
    expect(result.content[0].text).toContain("123456");
  });
});