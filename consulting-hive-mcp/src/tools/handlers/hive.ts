import type { AuthContext, ToolResult, HiveSearchParams } from '../../types/index.js';
import prisma from '../../db/client.js';
import { redactContent } from '../../agents/redaction.js';
import { refineHiveContribution } from '../../agents/hive-contribution.js';

export async function search(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const params = input as HiveSearchParams;
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 50);
  const skip = (page - 1) * limit;

  const baseWhere = { status: 'APPROVED' as const };

  const results: { type: string; items: unknown[] }[] = [];

  if (!params.type || params.type === 'pattern') {
    const where: Record<string, unknown> = { ...baseWhere };
    if (params.category) where.category = params.category;
    if (params.tags?.length) where.tags = { hasSome: params.tags };
    if (params.query) where.OR = [
      { title: { contains: params.query, mode: 'insensitive' } },
      { description: { contains: params.query, mode: 'insensitive' } },
    ];

    const patterns = await prisma.pattern.findMany({
      where,
      skip: params.type === 'pattern' ? skip : 0,
      take: params.type === 'pattern' ? limit : 10,
      select: { id: true, title: true, description: true, category: true, tags: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    results.push({ type: 'pattern', items: patterns });
  }

  if (!params.type || params.type === 'prompt') {
    const where: Record<string, unknown> = { ...baseWhere };
    if (params.tags?.length) where.tags = { hasSome: params.tags };
    if (params.query) where.OR = [
      { title: { contains: params.query, mode: 'insensitive' } },
      { description: { contains: params.query, mode: 'insensitive' } },
    ];

    const prompts = await prisma.prompt.findMany({
      where,
      skip: params.type === 'prompt' ? skip : 0,
      take: params.type === 'prompt' ? limit : 10,
      select: { id: true, title: true, description: true, useCase: true, tags: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    results.push({ type: 'prompt', items: prompts });
  }

  if (!params.type || params.type === 'stack') {
    const where: Record<string, unknown> = { ...baseWhere };
    if (params.category) where.category = params.category;
    if (params.tags?.length) where.tags = { hasSome: params.tags };
    if (params.query) where.OR = [
      { title: { contains: params.query, mode: 'insensitive' } },
      { description: { contains: params.query, mode: 'insensitive' } },
    ];

    const stacks = await prisma.stackTemplate.findMany({
      where,
      skip: params.type === 'stack' ? skip : 0,
      take: params.type === 'stack' ? limit : 10,
      select: { id: true, title: true, description: true, category: true, tags: true, uiTech: true, backendTech: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
    results.push({ type: 'stack', items: stacks });
  }

  return { success: true, data: { results, page, limit } };
}

interface GetPatternInput { patternId: string; }

export async function getPattern(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { patternId } = input as GetPatternInput;

  const pattern = await prisma.pattern.findUnique({
    where: { id: patternId },
    include: { creator: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!pattern || pattern.status !== 'APPROVED') {
    return { success: false, error: 'Pattern not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: pattern };
}

interface GetPromptInput { promptId: string; }

export async function getPrompt(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { promptId } = input as GetPromptInput;

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
    include: { creator: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!prompt || prompt.status !== 'APPROVED') {
    return { success: false, error: 'Prompt not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: prompt };
}

interface GetStackInput { stackId: string; }

export async function getStack(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { stackId } = input as GetStackInput;

  const stack = await prisma.stackTemplate.findUnique({
    where: { id: stackId },
    include: { creator: { select: { id: true, firstName: true, lastName: true } } },
  });

  if (!stack || stack.status !== 'APPROVED') {
    return { success: false, error: 'Stack not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: stack };
}

interface ContributeInput {
  type: 'pattern' | 'prompt' | 'stack';
  title: string;
  description?: string;
  content: string;
  category?: string;
  tags?: string[];
  engagementId?: string;
}

export async function contribute(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as ContributeInput;

  try {
    const redactionResult = await redactContent(data.content);

    const redactionJob = await prisma.redactionJob.create({
      data: {
        originalText: data.content,
        redactedText: redactionResult.redactedText,
        detectedPII: redactionResult.detectedPII,
        detectedSecrets: redactionResult.detectedSecrets,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    let contribution;

    if (data.type === 'pattern') {
      contribution = await prisma.pattern.create({
        data: {
          creatorId: context.userId,
          engagementId: data.engagementId,
          title: data.title,
          description: data.description || '',
          content: redactionResult.redactedText,
          category: data.category,
          tags: data.tags || [],
          status: 'PENDING_REVIEW',
          redactionJobId: redactionJob.id,
        },
      });
    } else if (data.type === 'prompt') {
      contribution = await prisma.prompt.create({
        data: {
          creatorId: context.userId,
          engagementId: data.engagementId,
          title: data.title,
          description: data.description,
          content: redactionResult.redactedText,
          tags: data.tags || [],
          status: 'PENDING_REVIEW',
          redactionJobId: redactionJob.id,
        },
      });
    } else {
      contribution = await prisma.stackTemplate.create({
        data: {
          creatorId: context.userId,
          engagementId: data.engagementId,
          title: data.title,
          description: data.description || '',
          content: redactionResult.redactedText,
          category: data.category,
          tags: data.tags || [],
          status: 'PENDING_REVIEW',
          redactionJobId: redactionJob.id,
        },
      });
    }

    return {
      success: true,
      data: {
        contribution,
        redaction: {
          piiDetected: redactionResult.detectedPII.length,
          secretsDetected: redactionResult.detectedSecrets.length,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process contribution',
      code: 'AI_ERROR',
    };
  }
}

interface RefineInput {
  contributionId: string;
  type: 'pattern' | 'prompt' | 'stack';
  feedback?: string;
}

export async function refineContribution(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { contributionId, type, feedback } = input as RefineInput;

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

  if (item.creatorId !== context.userId && context.role !== 'ADMIN') {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  try {
    const refined = await refineHiveContribution({
      type,
      title: item.title,
      description: 'description' in item ? (item.description ?? '') : '',
      content: item.content,
      feedback,
    });

    if (type === 'pattern') {
      await prisma.pattern.update({
        where: { id: contributionId },
        data: {
          title: refined.title,
          description: refined.description,
          content: refined.content,
        },
      });
    } else if (type === 'prompt') {
      await prisma.prompt.update({
        where: { id: contributionId },
        data: {
          title: refined.title,
          description: refined.description,
          content: refined.content,
        },
      });
    } else {
      await prisma.stackTemplate.update({
        where: { id: contributionId },
        data: {
          title: refined.title,
          description: refined.description,
          content: refined.content,
        },
      });
    }

    return { success: true, data: refined };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refine contribution',
      code: 'AI_ERROR',
    };
  }
}
