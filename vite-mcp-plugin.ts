import type { Plugin, ViteDevServer } from 'vite';
import type { IncomingMessage, ServerResponse } from 'node:http';

export function mcpServerPlugin(): Plugin {
  return {
    name: 'mcp-server',
    configureServer(server: ViteDevServer) {
      server.middlewares.use('/mcp', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          // Import the MCP server module
          const { default: createApp } = await server.ssrLoadModule('/src/server-app.ts');
          const app = createApp();
          
          // Handle the request with the Express app
          app(req, res);
        } catch (error) {
          console.error('MCP Server error:', error);
          res.statusCode = 500;
          res.end('Internal Server Error');
        }
      });
    }
  };
}