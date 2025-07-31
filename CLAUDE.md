# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Build the project
npm run build

# Development with hot reloading (builds and starts server with watch mode)
npm run dev

# Start the production server
npm start

# Testing
npm test               # Run tests with vitest in watch mode
npm run test:ci        # Run tests once with JSON output for CI

# Code quality
npm run lint           # Check for linting issues
npm run lint:fix       # Fix auto-fixable linting issues
npm run format         # Format code with Prettier
npm run format:check   # Check code formatting
```

## Architecture Overview

This is a Model Context Protocol (MCP) server that provides access to the dev.to public API. The architecture follows a simple two-layer pattern:

### Core Components

- **`src/index.ts`** - Main MCP server entry point that:
  - Sets up the HTTP server transport on port 3000 (configurable via PORT env var)
  - Defines all available MCP tools with their JSON schemas
  - Routes tool calls to the DevToAPI class
  - Handles error responses in MCP format

- **`src/devto-api.ts`** - API client class that:
  - Encapsulates all dev.to API calls using the base URL `https://dev.to/api`
  - Provides methods for each supported endpoint (articles, users, tags, comments, search)
  - Handles query parameter building and HTTP error responses
  - Returns data in MCP-compatible response format with JSON stringified content

### MCP Tools Available

The server exposes these tools to MCP clients:
- `get_articles` - List articles with filtering (username, tag, top, pagination, state)
- `get_article` - Get specific article by ID or path
- `get_user` - Get user info by ID or username  
- `get_tags` - Get popular tags with pagination
- `get_comments` - Get comments for an article by ID
- `search_articles` - Search articles with query and field filters

### Build System

- Uses Vite for building with ES modules output format
- TypeScript compilation targeting Node.js 18+ 
- External dependency: `@modelcontextprotocol/sdk` (not bundled)
- Source alias `@` points to `src/` directory
- Output goes to `dist/` directory

### Testing

- Uses Vitest as the test runner and framework
- Test files should be placed alongside source files with `.test.ts` extension
- Vitest provides built-in TypeScript support and ES modules compatibility
- Run `npm test` for watch mode development testing
- Run `npm run test:ci` for CI/automated testing with JSON output

### Code Style

- ESLint with TypeScript recommended rules
- Prettier formatting (empty config uses defaults)
- Private class methods use `#` syntax
- Unused parameter pattern: prefix with `_`
- `@typescript-eslint/no-explicit-any` set to warn (used for MCP argument flexibility)

## Key Implementation Details

- All API responses are wrapped in MCP `content` format with `type: 'text'` and JSON stringified data
- Query parameter building filters out undefined/null values automatically
- Error handling returns MCP-formatted error messages rather than throwing
- Server runs as HTTP transport (not stdio) for remote MCP connections
- No authentication required - uses dev.to's public API endpoints only