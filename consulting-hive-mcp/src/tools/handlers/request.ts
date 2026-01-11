import type { AuthContext, ToolResult, RequestSearchParams } from '../../types/index.js';
import prisma from '../../db/client.js';
import { refineRequest } from '../../agents/intake.js';

interface CreateRequestInput {
  title: string;
  rawDescription: string;
  constraints?: string;
  desiredOutcome?: string;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  budget?: number;
  currency?: string;
  skills?: string[];
}

export async function create(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as CreateRequestInput;

  const request = await prisma.request.create({
    data: {
      creatorId: context.userId,
      title: data.title,
      rawDescription: data.rawDescription,
      constraints: data.constraints,
      desiredOutcome: data.desiredOutcome,
      urgency: data.urgency || 'NORMAL',
      budget: data.budget,
      currency: data.currency || 'EUR',
      status: 'DRAFT',
    },
  });

  if (data.skills && data.skills.length > 0) {
    for (const skillName of data.skills) {
      const slug = skillName.toLowerCase().replace(/\s+/g, '-');
      let skillTag = await prisma.skillTag.findUnique({ where: { slug } });

      if (!skillTag) {
        skillTag = await prisma.skillTag.create({
          data: { name: skillName, slug },
        });
      }

      await prisma.requestSkill.create({
        data: { requestId: request.id, skillTagId: skillTag.id },
      });
    }
  }

  return { success: true, data: request };
}

interface GetRequestInput {
  requestId: string;
}

export async function get(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { requestId } = input as GetRequestInput;

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      creator: { select: { id: true, firstName: true, lastName: true } },
      skills: { include: { skillTag: true } },
      offers: {
        include: {
          consultant: {
            include: {
              user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
            },
          },
        },
      },
    },
  });

  if (!request) {
    return { success: false, error: 'Request not found', code: 'NOT_FOUND' };
  }

  const isOwner = request.creatorId === context.userId;
  const isConsultant = context.role === 'CONSULTANT' || context.role === 'BOTH';
  const isPublic = request.isPublic && request.status === 'PUBLISHED';

  if (!isOwner && !isPublic && !isConsultant) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  return { success: true, data: request };
}

export async function list(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const params = input as RequestSearchParams;
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 50);
  const skip = (page - 1) * limit;

  const isConsultant = context.role === 'CONSULTANT' || context.role === 'BOTH';

  const where: Record<string, unknown> = {};

  if (isConsultant) {
    where.isPublic = true;
    where.status = params.status || 'PUBLISHED';
  } else {
    where.creatorId = context.userId;
    if (params.status) where.status = params.status;
  }

  if (params.urgency) where.urgency = params.urgency;
  if (params.minBudget !== undefined || params.maxBudget !== undefined) {
    where.budget = {};
    if (params.minBudget !== undefined) (where.budget as Record<string, number>).gte = params.minBudget;
    if (params.maxBudget !== undefined) (where.budget as Record<string, number>).lte = params.maxBudget;
  }

  const [requests, total] = await Promise.all([
    prisma.request.findMany({
      where,
      skip,
      take: limit,
      include: {
        skills: { include: { skillTag: true } },
        _count: { select: { offers: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.request.count({ where }),
  ]);

  return {
    success: true,
    data: {
      items: requests,
      total,
      page,
      limit,
      hasMore: skip + requests.length < total,
    },
  };
}

interface UpdateRequestInput {
  requestId: string;
  title?: string;
  rawDescription?: string;
  constraints?: string;
  desiredOutcome?: string;
  urgency?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  budget?: number;
  status?: 'DRAFT' | 'PUBLISHED';
}

export async function update(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as UpdateRequestInput;

  const existing = await prisma.request.findUnique({
    where: { id: data.requestId },
  });

  if (!existing) {
    return { success: false, error: 'Request not found', code: 'NOT_FOUND' };
  }

  if (existing.creatorId !== context.userId) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  if (existing.status !== 'DRAFT' && existing.status !== 'PUBLISHED') {
    return { success: false, error: 'Cannot update request in current status', code: 'INVALID_STATUS' };
  }

  const request = await prisma.request.update({
    where: { id: data.requestId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.rawDescription !== undefined && { rawDescription: data.rawDescription }),
      ...(data.constraints !== undefined && { constraints: data.constraints }),
      ...(data.desiredOutcome !== undefined && { desiredOutcome: data.desiredOutcome }),
      ...(data.urgency !== undefined && { urgency: data.urgency }),
      ...(data.budget !== undefined && { budget: data.budget }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  return { success: true, data: request };
}

interface RefineRequestInput {
  requestId: string;
}

export async function refine(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { requestId } = input as RefineRequestInput;

  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return { success: false, error: 'Request not found', code: 'NOT_FOUND' };
  }

  if (request.creatorId !== context.userId) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  try {
    const refinedData = await refineRequest(request.rawDescription, request.constraints || undefined);

    const updated = await prisma.request.update({
      where: { id: requestId },
      data: {
        refinedSummary: refinedData.summary,
        desiredOutcome: refinedData.desiredOutcome || request.desiredOutcome,
        suggestedDuration: refinedData.suggestedDuration,
      },
    });

    if (refinedData.suggestedSkills && refinedData.suggestedSkills.length > 0) {
      await prisma.requestSkill.deleteMany({ where: { requestId } });

      for (const skillName of refinedData.suggestedSkills) {
        const slug = skillName.toLowerCase().replace(/\s+/g, '-');
        let skillTag = await prisma.skillTag.findUnique({ where: { slug } });

        if (!skillTag) {
          skillTag = await prisma.skillTag.create({ data: { name: skillName, slug } });
        }

        await prisma.requestSkill.create({
          data: { requestId, skillTagId: skillTag.id },
        });
      }
    }

    return {
      success: true,
      data: {
        request: updated,
        refinement: refinedData,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refine request',
      code: 'AI_ERROR',
    };
  }
}

interface CancelRequestInput {
  requestId: string;
  reason?: string;
}

export async function cancel(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { requestId, reason } = input as CancelRequestInput;

  const request = await prisma.request.findUnique({
    where: { id: requestId },
  });

  if (!request) {
    return { success: false, error: 'Request not found', code: 'NOT_FOUND' };
  }

  if (request.creatorId !== context.userId) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  if (request.status === 'COMPLETED' || request.status === 'CANCELLED') {
    return { success: false, error: 'Cannot cancel request in current status', code: 'INVALID_STATUS' };
  }

  const updated = await prisma.request.update({
    where: { id: requestId },
    data: { status: 'CANCELLED' },
  });

  await prisma.auditLog.create({
    data: {
      userId: context.userId,
      action: 'REQUEST_CANCELLED',
      entity: 'Request',
      entityId: requestId,
      metadata: { reason },
    },
  });

  return { success: true, data: updated };
}
