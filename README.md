# Dev.to MCP Server

A remote Model Context Protocol (MCP) server for interacting with the dev.to public API without requiring authentication.

## Features

This MCP server provides access to the following dev.to public API endpoints:

- **get_articles** - Get articles from dev.to with optional filters (username, tag, state, pagination)
- **get_article** - Get a specific article by ID or path
- **get_user** - Get user information by ID or username
- **get_tags** - Get popular tags from dev.to
- **get_comments** - Get comments for a specific article
- **search_articles** - Search articles using query parameters

## Installation

### Using npm

If you want to install and build from source using npm:

```bash
npm install
npm run build
```

## Usage

The server runs as a remote HTTP server on port 3000 (or the PORT environment variable) and can be used with any MCP-compatible client.

```bash
npm start
```

The server will be available at `http://localhost:3000` for MCP connections.

## Development

```bash
# Build the project
npm run build

# Watch mode for development
npm run dev

# Linting
npm run lint
npm run lint:fix

# Formatting
npm run format
npm run format:check
```

## Docker

### Using Pre-built Image

Pull and run the pre-built Docker image:

```bash
# Pull the image
docker pull docker.io/nickytonline/dev-to-mcp:latest

# Run it
docker run -d \
  --name dev-to-mcp \
  -e NODE_ENV=production \
  -e PORT=3000 \
  -p 3000:3000 \
  --restart unless-stopped \
  docker.io/nickytonline/dev-to-mcp:latest
```

Once it's up, check health status via:

```bash
curl -fsS http://127.0.0.1:3000/mcp
```

The server will be available at `http://localhost:3000/mcp` for MCP connections.

### Building from Source

Build and run the MCP server using Docker:

```bash
# Build the Docker image
docker build -t dev-to-mcp .

# Run the container
docker run -p 3000:3000 dev-to-mcp
```

### Docker Compose

Using the pre-built image with Docker Compose:

```yaml
services:
  dev-to-mcp:
    image: docker.io/nickytonline/dev-to-mcp:latest
    container_name: dev-to-mcp
    restart: unless-stopped
    environment:
      NODE_ENV: production
      PORT: 3000
    networks:
      - main
    healthcheck:
      # Uses $PORT at runtime; defaults to 3000 if not set
      test:
        [
          "CMD-SHELL",
          "curl -fsS http://127.0.0.1:${PORT:-3000}/mcp >/dev/null || exit 1",
        ]
      interval: 15s
      timeout: 5s
      retries: 5
      start_period: 30s

networks:
  main: {}
```

For development with a local build, you can also use Docker Compose:

```yaml
# docker-compose.yml
version: "3.8"
services:
  dev-to-mcp:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
```

```bash
docker-compose up --build
```

## API Endpoints

All endpoints use the public dev.to API (`https://dev.to/api`) and do not require authentication.

### get_articles

Get articles with optional filtering:

- `username` - Filter by author username
- `tag` - Filter by tag
- `top` - Top articles (1, 7, 30, or infinity days)
- `page` - Pagination page (default: 1)
- `per_page` - Articles per page (default: 30, max: 1000)
- `state` - Filter by state (fresh, rising, all)

### get_article

Get a specific article:

- `id` - Article ID
- `path` - Article path (e.g., "username/article-slug")

### get_user

Get user information:

- `id` - User ID
- `username` - Username

### get_tags

Get popular tags:

- `page` - Pagination page (default: 1)
- `per_page` - Tags per page (default: 10, max: 1000)

### get_comments

Get comments for an article:

- `article_id` - Article ID (required)

### search_articles

Search articles:

- `q` - Search query (required)
- `page` - Pagination page (default: 1)
- `per_page` - Articles per page (default: 30, max: 1000)
- `search_fields` - Fields to search (title, body_text, tag_list)

## License

MIT
