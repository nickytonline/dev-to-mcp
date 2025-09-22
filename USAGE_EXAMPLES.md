# Usage Examples

This document provides examples of how to use the dev-to-mcp server's MCP tools.

## Getting nickytonline's Latest Blog Posts

The simplest way to get nickytonline's latest blog posts is to use the dedicated tool:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_nickytonline_latest_posts",
    "arguments": {
      "per_page": 5
    }
  }
}
```

This will return the 5 most recent blog posts from nickytonline's dev.to profile.

## Alternative: Using the General get_articles Tool

You can also use the general `get_articles` tool with the username parameter:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "get_articles",
    "arguments": {
      "username": "nickytonline",
      "per_page": 5,
      "state": "all"
    }
  }
}
```

## Expected Response Format

Both methods will return a response in the following format:

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "[{\"id\":123456,\"title\":\"Latest Blog Post\",\"published_at\":\"2024-01-01T00:00:00Z\",\"url\":\"https://dev.to/nickytonline/latest-blog-post\",\"description\":\"Description of the post...\"}]"
      }
    ]
  }
}
```

The response contains an array of articles with the following key fields:
- `id` - Article ID
- `title` - Article title
- `published_at` - Publication date
- `url` - Article URL
- `description` - Article description
- `tag_list` - Array of tags
- And many other fields from the dev.to API

## Server Setup

Make sure the server is running:

```bash
npm start
```

The server will be available at `http://localhost:3000/mcp` for MCP connections.