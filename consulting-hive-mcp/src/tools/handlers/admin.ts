import type { AuthContext, ToolResult } from '../../types/index.js';
import prisma from '../../db/client.js';

function requireAdmin(context: AuthContext | null): ToolResult | null {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };
  if (context.role !== 'ADMIN') return { success: false, error: 'Admin access required', code: 'FORBIDDEN' };
  return null;
}

interface ModerationQueueInput {
  type?: 'pattern' | 'prompt' | 'stack' | 'all';
  page?: number;
  limit?: number;
}

export async function getModerationQueue(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  const authError = requireAdmin(context);
  if (authError) return authError;

  const params = input as ModerationQueueInput;
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 50);
  const skip = (page - 1) * limit;

  const pendingStatus = 'PENDING_REVIEW';
  const results: { type: string; items: unknown[]; count: number }[] = [];

  if (!params.type || params.type === 'all' || params.type === 'pattern') {
    const [patterns, count] = await Promise.all([
      prisma.pattern.findMany({
        where: { status: pendingStatus },
        skip: params.type === 'pattern' ? skip : 0,
        take: params.type === 'pattern' ? limit : 5,
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          redactionJob: { select: { detectedPII: true, detectedSecrets: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.pattern.count({ where: { status: pendingStatus } }),
    ]);
    results.push({ type: 'pattern', items: patterns, count });
  }

  if (!params.type || params.type === 'all' || params.type === 'prompt') {
    const [prompts, count] = await Promise.all([
      prisma.prompt.findMany({
        where: { status: pendingStatus },
        skip: params.type === 'prompt' ? skip : 0,
        take: params.type === 'prompt' ? limit : 5,
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          redactionJob: { select: { detectedPII: true, detectedSecrets: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.prompt.count({ where: { status: pendingStatus } }),
    ]);
    results.push({ type: 'prompt', items: prompts, count });
  }

  if (!params.type || params.type === 'all' || params.type === 'stack') {
    const [stacks, count] = await Promise.all([
      prisma.stackTemplate.findMany({
        where: { status: pendingStatus },
        skip: params.type === 'stack' ? skip : 0,
        take: params.type === 'stack' ? limit : 5,
        include: {
          creator: { select: { id: true, firstName: true, lastName: true, email: true } },
          redactionJob: { select: { detectedPII: true, detectedSecrets: true } },
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.stackTemplate.count({ where: { status: pendingStatus } }),
    ]);
    results.push({ type: 'stack', items: stacks, count });
  }

  const totalPending = results.reduce((sum, r) => sum + r.count, 0);

  return { success: true, data: { results, totalPending, page, limit } };
}

interface ApproveInput {
  contributionId: string;
  type: 'pattern' | 'prompt' | 'stack';
}

export async function approve(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  const authError = requireAdmin(context);
  if (authError) return authError;

  const { contributionId, type } = input as ApproveInput;

  let item;
  if (type === 'pattern') {
    item = await prisma.pattern.findUnique({ where: { id: contributionId } });
  } else if (type === 'prompt') {
    item = await prisma.prompt.findUnique({ where: { id: contributionId } });
  } else {
    item = await prisma.stackTemplate.findUnique({ where: { id: contributionId } });
  }

  if (!item) {
    return { success: false, error: 'Contribution not found', code: 'NOT_FOUND' };
  }

  if (item.status !== 'PENDING_REVIEW') {
    return { success: false, error: 'Not pending review', code: 'INVALID_STATUS' };
  }

  let updated;
  if (type === 'pattern') {
    updated = await prisma.pattern.update({
      where: { id: contributionId },
      data: { status: 'APPROVED' },
    });
  } else if (type === 'prompt') {
    updated = await prisma.prompt.update({
      where: { id: contributionId },
      data: { status: 'APPROVED' },
    });
  } else {
    updated = await prisma.stackTemplate.update({
      where: { id: contributionId },
      data: { status: 'APPROVED' },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: context!.userId,
      action: 'CONTRIBUTION_APPROVED',
      entity: type,
      entityId: contributionId,
    },
  });

  return { success: true, data: updated };
}

interface RejectInput {
  contributionId: string;
  type: 'pattern' | 'prompt' | 'stack';
  reason: string;
}

export async function reject(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  const authError = requireAdmin(context);
  if (authError) return authError;

  const { contributionId, type, reason } = input as RejectInput;

  let item;
  if (type === 'pattern') {
    item = await prisma.pattern.findUnique({ where: { id: contributionId } });
  } else if (type === 'prompt') {
    item = await prisma.prompt.findUnique({ where: { id: contributionId } });
  } else {
    item = await prisma.stackTemplate.findUnique({ where: { id: contributionId } });
  }

  if (!item) {
    return { success: false, error: 'Contribution not found', code: 'NOT_FOUND' };
  }

  if (item.status !== 'PENDING_REVIEW') {
    return { success: false, error: 'Not pending review', code: 'INVALID_STATUS' };
  }

  let updated;
  if (type === 'pattern') {
    updated = await prisma.pattern.update({
      where: { id: contributionId },
      data: { status: 'REJECTED' },
    });
  } else if (type === 'prompt') {
    updated = await prisma.prompt.update({
      where: { id: contributionId },
      data: { status: 'REJECTED' },
    });
  } else {
    updated = await prisma.stackTemplate.update({
      where: { id: contributionId },
      data: { status: 'REJECTED' },
    });
  }

  await prisma.auditLog.create({
    data: {
      userId: context!.userId,
      action: 'CONTRIBUTION_REJECTED',
      entity: type,
      entityId: contributionId,
      metadata: { reason },
    },
  });

  return { success: true, data: updated };
}
