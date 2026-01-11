import { writeFileSync } from 'fs';
import { tools } from '../src/tools/registry.js';

interface OpenAPISchema {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
  };
  servers: Array<{ url: string; description: string }>;
  paths: Record<string, unknown>;
  components: {
    securitySchemes: Record<string, unknown>;
    schemas: Record<string, unknown>;
  };
  security: Array<Record<string, unknown>>;
}

function generateOpenAPISpec(): OpenAPISchema {
  const paths: Record<string, unknown> = {};

  for (const tool of tools) {
    const path = `/tools/${tool.name}`;
    const inputSchema = tool.inputSchema as {
      properties?: Record<string, unknown>;
      required?: string[];
    };

    paths[path] = {
      post: {
        operationId: tool.name,
        summary: tool.description,
        tags: [tool.category],
        ...(tool.requiresAuth && { security: [{ BearerAuth: [] }] }),
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: inputSchema.properties || {},
                required: inputSchema.required || [],
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: { type: 'object' },
                    error: { type: 'string' },
                    code: { type: 'string' },
                  },
                },
              },
            },
          },
          '400': { description: 'Bad request' },
          '401': { description: 'Unauthorized' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Not found' },
        },
      },
    };
  }

  // Add auth endpoints
  paths['/auth/google'] = {
    get: {
      operationId: 'authGoogle',
      summary: 'Initiate Google OAuth flow',
      tags: ['auth'],
      responses: {
        '302': { description: 'Redirect to Google OAuth' },
      },
    },
  };

  paths['/auth/google/callback'] = {
    get: {
      operationId: 'authGoogleCallback',
      summary: 'Google OAuth callback',
      tags: ['auth'],
      parameters: [
        { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': {
          description: 'Authentication successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: {
                    type: 'object',
                    properties: {
                      token: { type: 'string' },
                      user: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  };

  paths['/auth/linkedin'] = {
    get: {
      operationId: 'authLinkedIn',
      summary: 'Initiate LinkedIn OAuth flow',
      tags: ['auth'],
      responses: {
        '302': { description: 'Redirect to LinkedIn OAuth' },
      },
    },
  };

  paths['/auth/linkedin/callback'] = {
    get: {
      operationId: 'authLinkedInCallback',
      summary: 'LinkedIn OAuth callback',
      tags: ['auth'],
      parameters: [
        { name: 'code', in: 'query', required: true, schema: { type: 'string' } },
      ],
      responses: {
        '200': { description: 'Authentication successful' },
      },
    },
  };

  return {
    openapi: '3.1.0',
    info: {
      title: 'Consulting Hive Mind MCP API',
      description: 'REST API for Consulting Hive Mind platform. Compatible with GPT Actions.',
      version: '0.1.0',
    },
    servers: [
      { url: 'http://localhost:3101', description: 'Development server' },
    ],
    paths,
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {},
    },
    security: [],
  };
}

const spec = generateOpenAPISpec();
writeFileSync('openapi.json', JSON.stringify(spec, null, 2));
console.log('Generated openapi.json with', Object.keys(spec.paths).length, 'endpoints');
