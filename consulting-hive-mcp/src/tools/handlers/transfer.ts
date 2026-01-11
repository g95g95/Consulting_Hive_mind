import type { AuthContext, ToolResult } from '../../types/index.js';
import prisma from '../../db/client.js';
import { generateTransferPack } from '../../agents/transfer.js';

async function verifyEngagementAccess(engagementId: string, userId: string): Promise<boolean> {
  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    include: { booking: { select: { clientId: true, consultantId: true } } },
  });

  if (!engagement) return false;

  return engagement.booking.clientId === userId ||
         engagement.booking.consultantId === userId;
}

interface GenerateInput {
  engagementId: string;
}

export async function generate(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { engagementId } = input as GenerateInput;

  if (!await verifyEngagementAccess(engagementId, context.userId)) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    include: {
      booking: {
        include: {
          request: true,
          client: { select: { firstName: true, lastName: true } },
          consultant: { select: { firstName: true, lastName: true } },
        },
      },
      messages: { orderBy: { createdAt: 'asc' } },
      notes: { where: { isPrivate: false } },
      checklistItems: true,
    },
  });

  if (!engagement) {
    return { success: false, error: 'Engagement not found', code: 'NOT_FOUND' };
  }

  try {
    const packContent = await generateTransferPack({
      request: engagement.booking.request,
      messages: engagement.messages,
      notes: engagement.notes,
      checklistItems: engagement.checklistItems,
    });

    const existingPack = await prisma.transferPack.findUnique({
      where: { engagementId },
    });

    let transferPack;
    if (existingPack) {
      transferPack = await prisma.transferPack.update({
        where: { engagementId },
        data: {
          summary: packContent.summary,
          keyDecisions: packContent.keyDecisions,
          runbook: packContent.runbook,
          nextSteps: packContent.nextSteps,
          internalizationChecklist: packContent.internalizationChecklist,
          aiGenerated: true,
        },
      });
    } else {
      transferPack = await prisma.transferPack.create({
        data: {
          engagementId,
          summary: packContent.summary,
          keyDecisions: packContent.keyDecisions,
          runbook: packContent.runbook,
          nextSteps: packContent.nextSteps,
          internalizationChecklist: packContent.internalizationChecklist,
          aiGenerated: true,
        },
      });
    }

    return { success: true, data: transferPack };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate transfer pack',
      code: 'AI_ERROR',
    };
  }
}

interface GetTransferInput {
  engagementId: string;
}

export async function get(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { engagementId } = input as GetTransferInput;

  if (!await verifyEngagementAccess(engagementId, context.userId)) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const transferPack = await prisma.transferPack.findUnique({
    where: { engagementId },
  });

  if (!transferPack) {
    return { success: false, error: 'Transfer pack not found', code: 'NOT_FOUND' };
  }

  return { success: true, data: transferPack };
}

interface UpdateTransferInput {
  engagementId: string;
  summary?: string;
  keyDecisions?: string;
  runbook?: string;
  nextSteps?: string;
  internalizationChecklist?: string;
}

export async function update(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as UpdateTransferInput;

  if (!await verifyEngagementAccess(data.engagementId, context.userId)) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const existing = await prisma.transferPack.findUnique({
    where: { engagementId: data.engagementId },
  });

  if (!existing) {
    return { success: false, error: 'Transfer pack not found', code: 'NOT_FOUND' };
  }

  if (existing.isFinalized) {
    return { success: false, error: 'Transfer pack is finalized', code: 'ALREADY_FINALIZED' };
  }

  const transferPack = await prisma.transferPack.update({
    where: { engagementId: data.engagementId },
    data: {
      ...(data.summary !== undefined && { summary: data.summary }),
      ...(data.keyDecisions !== undefined && { keyDecisions: data.keyDecisions }),
      ...(data.runbook !== undefined && { runbook: data.runbook }),
      ...(data.nextSteps !== undefined && { nextSteps: data.nextSteps }),
      ...(data.internalizationChecklist !== undefined && { internalizationChecklist: data.internalizationChecklist }),
    },
  });

  return { success: true, data: transferPack };
}

interface FinalizeInput {
  engagementId: string;
}

export async function finalize(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { engagementId } = input as FinalizeInput;

  if (!await verifyEngagementAccess(engagementId, context.userId)) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const existing = await prisma.transferPack.findUnique({
    where: { engagementId },
  });

  if (!existing) {
    return { success: false, error: 'Transfer pack not found', code: 'NOT_FOUND' };
  }

  if (existing.isFinalized) {
    return { success: false, error: 'Already finalized', code: 'ALREADY_FINALIZED' };
  }

  if (!existing.summary || !existing.keyDecisions) {
    return {
      success: false,
      error: 'Transfer pack incomplete (summary and keyDecisions required)',
      code: 'INCOMPLETE',
    };
  }

  const transferPack = await prisma.transferPack.update({
    where: { engagementId },
    data: { isFinalized: true },
  });

  await prisma.engagement.update({
    where: { id: engagementId },
    data: { status: 'TRANSFERRED' },
  });

  return { success: true, data: transferPack };
}
