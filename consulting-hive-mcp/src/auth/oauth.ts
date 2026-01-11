import type { OAuthTokenResponse, AuthContext } from '../types/index.js';
import prisma from '../db/client.js';
import { createToken } from './jwt.js';

interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

interface LinkedInUserInfo {
  sub: string;
  email: string;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

export async function exchangeGoogleCode(code: string): Promise<{ token: string; user: AuthContext }> {
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      redirect_uri: `${process.env.APP_URL || 'http://localhost:3101'}/auth/google/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange Google authorization code');
  }

  const tokens: OAuthTokenResponse = await tokenResponse.json();

  const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch Google user info');
  }

  const userInfo: GoogleUserInfo = await userInfoResponse.json();

  const user = await findOrCreateUser({
    email: userInfo.email,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    imageUrl: userInfo.picture,
    provider: 'google',
    providerId: userInfo.id,
  });

  const authContext: AuthContext = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clerkId: user.clerkId,
  };

  const token = await createToken(authContext);

  return { token, user: authContext };
}

export async function exchangeLinkedInCode(code: string): Promise<{ token: string; user: AuthContext }> {
  const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.LINKEDIN_CLIENT_ID || '',
      client_secret: process.env.LINKEDIN_CLIENT_SECRET || '',
      redirect_uri: `${process.env.APP_URL || 'http://localhost:3101'}/auth/linkedin/callback`,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    throw new Error('Failed to exchange LinkedIn authorization code');
  }

  const tokens: OAuthTokenResponse = await tokenResponse.json();

  const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!userInfoResponse.ok) {
    throw new Error('Failed to fetch LinkedIn user info');
  }

  const userInfo: LinkedInUserInfo = await userInfoResponse.json();

  const user = await findOrCreateUser({
    email: userInfo.email,
    firstName: userInfo.given_name,
    lastName: userInfo.family_name,
    imageUrl: userInfo.picture,
    provider: 'linkedin',
    providerId: userInfo.sub,
  });

  const authContext: AuthContext = {
    userId: user.id,
    email: user.email,
    role: user.role,
    clerkId: user.clerkId,
  };

  const token = await createToken(authContext);

  return { token, user: authContext };
}

interface CreateUserParams {
  email: string;
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
  provider: 'google' | 'linkedin';
  providerId: string;
}

async function findOrCreateUser(params: CreateUserParams) {
  let user = await prisma.user.findUnique({
    where: { email: params.email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: params.email,
        firstName: params.firstName,
        lastName: params.lastName,
        imageUrl: params.imageUrl,
        clerkId: `${params.provider}_${params.providerId}`,
        role: 'CLIENT',
        onboarded: false,
      },
    });
  } else if (params.imageUrl && !user.imageUrl) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { imageUrl: params.imageUrl },
    });
  }

  return user;
}

export function getGoogleAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || '',
    redirect_uri: `${process.env.APP_URL || 'http://localhost:3101'}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function getLinkedInAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: process.env.LINKEDIN_CLIENT_ID || '',
    redirect_uri: `${process.env.APP_URL || 'http://localhost:3101'}/auth/linkedin/callback`,
    response_type: 'code',
    scope: 'openid profile email',
  });

  return `https://www.linkedin.com/oauth/v2/authorization?${params}`;
}
