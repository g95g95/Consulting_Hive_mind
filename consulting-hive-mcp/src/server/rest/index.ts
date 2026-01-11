import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { serve } from '@hono/node-server';
import { tools } from '../../tools/registry.js';
import { executeTool } from '../../tools/executor.js';
import { verifyToken, extractBearerToken } from '../../auth/jwt.js';
import {
  exchangeGoogleCode,
  exchangeLinkedInCode,
  getGoogleAuthUrl,
  getLinkedInAuthUrl,
} from '../../auth/oauth.js';
import type { AuthContext } from '../../types/index.js';

const app = new Hono();

app.use('*', cors());
app.use('*', logger());

async function getAuthContext(authHeader: string | undefined): Promise<AuthContext | null> {
  const token = extractBearerToken(authHeader);
  if (!token) return null;
  return verifyToken(token);
}

app.get('/', (c) => {
  return c.json({
    name: 'Consulting Hive MCP - REST API',
    version: '0.1.0',
    endpoints: {
      tools: '/tools',
      execute: '/tools/:name',
      auth: '/auth/:provider',
      openapi: '/openapi.json',
    },
  });
});

app.get('/tools', (c) => {
  return c.json({
    tools: tools.map((t) => ({
      name: t.name,
      description: t.description,
      category: t.category,
      requiresAuth: t.requiresAuth,
      inputSchema: t.inputSchema,
    })),
  });
});

app.post('/tools/:name', async (c) => {
  const name = c.req.param('name');
  const tool = tools.find((t) => t.name === name);

  if (!tool) {
    return c.json({ success: false, error: `Unknown tool: ${name}`, code: 'NOT_FOUND' }, 404);
  }

  let body: unknown = {};
  try {
    body = await c.req.json();
  } catch {
    // Empty body is ok for some tools
  }

  let context: AuthContext | null = null;
  if (tool.requiresAuth) {
    context = await getAuthContext(c.req.header('Authorization'));
    if (!context) {
      return c.json({ success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' }, 401);
    }
  }

  const result = await executeTool({
    toolName: name,
    input: body,
    context,
  });

  const status = result.success ? 200 : result.code === 'NOT_FOUND' ? 404 : result.code === 'FORBIDDEN' ? 403 : 400;
  return c.json(result, status);
});

// OAuth endpoints
app.get('/auth/google', (c) => {
  return c.redirect(getGoogleAuthUrl());
});

app.get('/auth/google/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) {
    return c.json({ success: false, error: 'Missing authorization code' }, 400);
  }

  try {
    const result = await exchangeGoogleCode(code);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }, 400);
  }
});

app.get('/auth/linkedin', (c) => {
  return c.redirect(getLinkedInAuthUrl());
});

app.get('/auth/linkedin/callback', async (c) => {
  const code = c.req.query('code');
  if (!code) {
    return c.json({ success: false, error: 'Missing authorization code' }, 400);
  }

  try {
    const result = await exchangeLinkedInCode(code);
    return c.json({ success: true, data: result });
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    }, 400);
  }
});

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export function startRESTServer(port: number = 3101): void {
  serve({
    fetch: app.fetch,
    port,
  });
  console.log(`REST Server running on http://localhost:${port}`);
}

export { app };
