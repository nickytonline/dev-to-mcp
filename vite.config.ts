import { defineConfig } from 'vite';
import { resolve } from 'path';
import { mcpServerPlugin } from './vite-mcp-plugin.js';

export default defineConfig(({ command }) => ({
  plugins: command === 'serve' ? [mcpServerPlugin()] : [],
  
  // Development server configuration
  server: {
    port: 5173
  },
  
  // Build configuration (unchanged)
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'DevToMCP',
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: [
        '@modelcontextprotocol/sdk',
        '@modelcontextprotocol/sdk/server/mcp.js',
        '@modelcontextprotocol/sdk/server/streamableHttp.js',
        '@modelcontextprotocol/sdk/types.js',
        'express',
        'zod',
        'node:crypto',
        'node:http',
        'node:path',
        'node:fs',
        'node:url',
        'node:buffer',
        'node:stream',
        'node:events',
        'node:util',
        'crypto',
        'http',
        'path',
        'fs',
        'url',
        'buffer',
        'stream',
        'events',
        'util'
      ],
      output: {
        format: 'es'
      }
    },
    target: 'node18',
    outDir: 'dist',
    emptyOutDir: true,
    ssr: true
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  ssr: {
    external: ['@modelcontextprotocol/sdk', 'express', 'zod']
  }
}));