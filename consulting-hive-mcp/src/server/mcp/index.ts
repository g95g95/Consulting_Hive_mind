import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { tools, getToolSchemas } from '../../tools/registry.js';
import { executeTool } from '../../tools/executor.js';
import { verifyToken, extractBearerToken } from '../../auth/jwt.js';
import type { AuthContext } from '../../types/index.js';

const server = new Server(
  {
    name: 'consulting-hive-mcp',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let currentAuthContext: AuthContext | null = null;

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: getToolSchemas().map((t) => ({
      name: t.name,
      description: t.description as string,
      inputSchema: t.inputSchema as Record<string, unknown>,
    })),
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  const tool = tools.find((t) => t.name === name);
  if (!tool) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: false, error: `Unknown tool: ${name}` }),
        },
      ],
    };
  }

  if (tool.requiresAuth && !currentAuthContext) {
    if (args && typeof args === 'object' && 'token' in args) {
      const token = args.token as string;
      currentAuthContext = await verifyToken(token);
    }

    if (!currentAuthContext) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'Authentication required. Use user_authenticate first.',
              code: 'UNAUTHORIZED',
            }),
          },
        ],
      };
    }
  }

  const result = await executeTool({
    toolName: name,
    input: args,
    context: currentAuthContext,
  });

  if (name === 'user_authenticate' && result.success && result.data) {
    const authData = result.data as { token: string; user: AuthContext };
    currentAuthContext = authData.user;
  }

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify(result),
      },
    ],
  };
});

export async function startMCPServer(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running on stdio');
}

export { server };
