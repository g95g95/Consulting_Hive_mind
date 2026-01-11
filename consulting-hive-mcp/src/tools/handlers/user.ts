import type { AuthContext, ToolResult, ConsultantSearchParams } from '../../types/index.js';
import prisma from '../../db/client.js';
import { exchangeGoogleCode, exchangeLinkedInCode } from '../../auth/oauth.js';

interface AuthInput {
  provider: 'google' | 'linkedin';
  code: string;
}

export async function authenticate(input: unknown): Promise<ToolResult> {
  const { provider, code } = input as AuthInput;

  try {
    const result = provider === 'google'
      ? await exchangeGoogleCode(code)
      : await exchangeLinkedInCode(code);

    return {
      success: true,
      data: {
        token: result.token,
        user: result.user,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
      code: 'AUTH_FAILED',
    };
  }
}

export async function getProfile(_input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const user = await prisma.user.findUnique({
    where: { id: context.userId },
    include: {
      consultantProfile: {
        include: {
          skills: { include: { skillTag: true } },
          availability: true,
        },
      },
      clientProfile: {
        include: { organization: true },
      },
    },
  });

  if (!user) {
    return { success: false, error: 'User not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: user };
}

interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  imageUrl?: string;
}

export async function updateProfile(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { firstName, lastName, imageUrl } = input as UpdateProfileInput;

  const user = await prisma.user.update({
    where: { id: context.userId },
    data: {
      ...(firstName !== undefined && { firstName }),
      ...(lastName !== undefined && { lastName }),
      ...(imageUrl !== undefined && { imageUrl }),
    },
  });

  return { success: true, data: user };
}

interface ConsultantProfileInput {
  headline?: string;
  bio?: string;
  hourlyRate?: number;
  currency?: string;
  languages?: string[];
  timezone?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  yearsExperience?: number;
  skills?: Array<{ name: string; level: string }>;
}

export async function createConsultantProfile(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as ConsultantProfileInput;

  const existing = await prisma.consultantProfile.findUnique({
    where: { userId: context.userId },
  });

  if (existing) {
    return { success: false, error: 'Consultant profile already exists', code: 'ALREADY_EXISTS' };
  }

  const profile = await prisma.consultantProfile.create({
    data: {
      userId: context.userId,
      headline: data.headline,
      bio: data.bio,
      hourlyRate: data.hourlyRate,
      currency: data.currency || 'EUR',
      languages: data.languages || [],
      timezone: data.timezone,
      linkedinUrl: data.linkedinUrl,
      portfolioUrl: data.portfolioUrl,
      yearsExperience: data.yearsExperience,
    },
  });

  if (data.skills && data.skills.length > 0) {
    for (const skill of data.skills) {
      let skillTag = await prisma.skillTag.findUnique({
        where: { slug: skill.name.toLowerCase().replace(/\s+/g, '-') },
      });

      if (!skillTag) {
        skillTag = await prisma.skillTag.create({
          data: {
            name: skill.name,
            slug: skill.name.toLowerCase().replace(/\s+/g, '-'),
          },
        });
      }

      await prisma.consultantSkill.create({
        data: {
          profileId: profile.id,
          skillTagId: skillTag.id,
          level: skill.level as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT',
        },
      });
    }
  }

  await prisma.user.update({
    where: { id: context.userId },
    data: { role: context.role === 'CLIENT' ? 'BOTH' : 'CONSULTANT' },
  });

  return { success: true, data: profile };
}

interface UpdateConsultantInput {
  headline?: string;
  bio?: string;
  hourlyRate?: number;
  isAvailable?: boolean;
  consentDirectory?: boolean;
  consentHiveMind?: boolean;
}

export async function updateConsultantProfile(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as UpdateConsultantInput;

  const profile = await prisma.consultantProfile.update({
    where: { userId: context.userId },
    data: {
      ...(data.headline !== undefined && { headline: data.headline }),
      ...(data.bio !== undefined && { bio: data.bio }),
      ...(data.hourlyRate !== undefined && { hourlyRate: data.hourlyRate }),
      ...(data.isAvailable !== undefined && { isAvailable: data.isAvailable }),
      ...(data.consentDirectory !== undefined && { consentDirectory: data.consentDirectory }),
      ...(data.consentHiveMind !== undefined && { consentHiveMind: data.consentHiveMind }),
    },
  });

  return { success: true, data: profile };
}

interface ClientProfileInput {
  companyName?: string;
  companyRole?: string;
  preferredLanguage?: string;
  billingEmail?: string;
  billingAddress?: string;
  vatNumber?: string;
}

export async function createClientProfile(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as ClientProfileInput;

  const existing = await prisma.clientProfile.findUnique({
    where: { userId: context.userId },
  });

  if (existing) {
    return { success: false, error: 'Client profile already exists', code: 'ALREADY_EXISTS' };
  }

  const profile = await prisma.clientProfile.create({
    data: {
      userId: context.userId,
      companyName: data.companyName,
      companyRole: data.companyRole,
      preferredLanguage: data.preferredLanguage,
      billingEmail: data.billingEmail,
      billingAddress: data.billingAddress,
      vatNumber: data.vatNumber,
    },
  });

  return { success: true, data: profile };
}

export async function updateClientProfile(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as ClientProfileInput;

  const profile = await prisma.clientProfile.update({
    where: { userId: context.userId },
    data: {
      ...(data.companyName !== undefined && { companyName: data.companyName }),
      ...(data.companyRole !== undefined && { companyRole: data.companyRole }),
      ...(data.preferredLanguage !== undefined && { preferredLanguage: data.preferredLanguage }),
      ...(data.billingEmail !== undefined && { billingEmail: data.billingEmail }),
      ...(data.billingAddress !== undefined && { billingAddress: data.billingAddress }),
      ...(data.vatNumber !== undefined && { vatNumber: data.vatNumber }),
    },
  });

  return { success: true, data: profile };
}

export async function searchDirectory(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const params = input as ConsultantSearchParams;
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    consentDirectory: true,
    isAvailable: params.isAvailable ?? true,
  };

  if (params.minRate !== undefined || params.maxRate !== undefined) {
    where.hourlyRate = {};
    if (params.minRate !== undefined) (where.hourlyRate as Record<string, number>).gte = params.minRate;
    if (params.maxRate !== undefined) (where.hourlyRate as Record<string, number>).lte = params.maxRate;
  }

  if (params.languages && params.languages.length > 0) {
    where.languages = { hasSome: params.languages };
  }

  if (params.skills && params.skills.length > 0) {
    where.skills = {
      some: {
        skillTag: {
          slug: { in: params.skills.map(s => s.toLowerCase().replace(/\s+/g, '-')) },
        },
      },
    };
  }

  const [consultants, total] = await Promise.all([
    prisma.consultantProfile.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        skills: { include: { skillTag: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.consultantProfile.count({ where }),
  ]);

  return {
    success: true,
    data: {
      items: consultants,
      total,
      page,
      limit,
      hasMore: skip + consultants.length < total,
    },
  };
}

interface GetConsultantInput {
  consultantId: string;
}

export async function getConsultantById(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { consultantId } = input as GetConsultantInput;

  const consultant = await prisma.consultantProfile.findUnique({
    where: { id: consultantId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      skills: { include: { skillTag: true } },
      availability: true,
      references: { where: { isPublic: true } },
    },
  });

  if (!consultant) {
    return { success: false, error: 'Consultant not found', code: 'NOT_FOUND' };
  }

  if (!consultant.consentDirectory) {
    return { success: false, error: 'Consultant profile is not public', code: 'NOT_PUBLIC' };
  }

  return { success: true, data: consultant };
}
