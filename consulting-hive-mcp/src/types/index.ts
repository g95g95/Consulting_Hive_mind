import type { UserRole } from '@prisma/client';

export interface AuthContext {
  userId: string;
  email: string;
  role: UserRole;
  clerkId?: string;
}

export interface ToolResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  requiresAuth: boolean;
  inputSchema: Record<string, unknown>;
  handler: (input: unknown, context: AuthContext | null) => Promise<ToolResult>;
}

export type ToolCategory =
  | 'user'
  | 'request'
  | 'offer'
  | 'engagement'
  | 'transfer'
  | 'hive'
  | 'review'
  | 'admin';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface ConsultantSearchParams extends PaginationParams {
  skills?: string[];
  minRate?: number;
  maxRate?: number;
  languages?: string[];
  isAvailable?: boolean;
}

export interface RequestSearchParams extends PaginationParams {
  status?: string;
  urgency?: string;
  minBudget?: number;
  maxBudget?: number;
}

export interface HiveSearchParams extends PaginationParams {
  type?: 'pattern' | 'prompt' | 'stack';
  category?: string;
  tags?: string[];
  query?: string;
}

export interface OAuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in: number;
  scope?: string;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  clerkId?: string;
  iat: number;
  exp: number;
}
