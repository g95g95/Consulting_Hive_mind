import * as jose from 'jose';
import type { AuthContext, JWTPayload } from '../types/index.js';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'development-secret-change-in-production'
);

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function parseExpiresIn(expiresIn: string): number {
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60; // default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 60 * 60;
    case 'd': return value * 24 * 60 * 60;
    default: return 7 * 24 * 60 * 60;
  }
}

export async function createToken(context: AuthContext): Promise<string> {
  const expiresInSeconds = parseExpiresIn(JWT_EXPIRES_IN);

  const jwt = await new jose.SignJWT({
    sub: context.userId,
    email: context.email,
    role: context.role,
    clerkId: context.clerkId,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expiresInSeconds}s`)
    .sign(JWT_SECRET);

  return jwt;
}

export async function verifyToken(token: string): Promise<AuthContext | null> {
  try {
    const { payload } = await jose.jwtVerify(token, JWT_SECRET);
    const jwtPayload = payload as unknown as JWTPayload;

    return {
      userId: jwtPayload.sub,
      email: jwtPayload.email,
      role: jwtPayload.role,
      clerkId: jwtPayload.clerkId,
    };
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1];
}
