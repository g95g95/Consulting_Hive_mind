import type { AuthContext, ToolResult } from '../types/index.js';
import { getToolByName } from './registry.js';

export interface ExecuteOptions {
  toolName: string;
  input: unknown;
  context: AuthContext | null;
}

export async function executeTool(options: ExecuteOptions): Promise<ToolResult> {
  const { toolName, input, context } = options;

  const tool = getToolByName(toolName);

  if (!tool) {
    return {
      success: false,
      error: `Unknown tool: ${toolName}`,
      code: 'TOOL_NOT_FOUND',
    };
  }

  if (tool.requiresAuth && !context) {
    return {
      success: false,
      error: 'Authentication required',
      code: 'UNAUTHORIZED',
    };
  }

  try {
    const result = await tool.handler(input, context);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: message,
      code: 'EXECUTION_ERROR',
    };
  }
}

export function validateInput(toolName: string, input: unknown): { valid: boolean; errors: string[] } {
  const tool = getToolByName(toolName);
  if (!tool) {
    return { valid: false, errors: [`Unknown tool: ${toolName}`] };
  }

  const errors: string[] = [];
  const schema = tool.inputSchema as {
    required?: string[];
    properties?: Record<string, { type: string }>;
  };

  if (schema.required && Array.isArray(schema.required)) {
    const inputObj = (input as Record<string, unknown>) || {};
    for (const field of schema.required) {
      if (inputObj[field] === undefined || inputObj[field] === null) {
        errors.push(`Missing required field: ${field}`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
