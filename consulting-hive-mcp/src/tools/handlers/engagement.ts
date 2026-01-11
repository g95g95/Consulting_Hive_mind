import type { AuthContext, ToolResult } from '../../types/index.js';
import prisma from '../../db/client.js';

async function verifyEngagementAccess(engagementId: string, userId: string): Promise<{ allowed: boolean; engagement?: unknown }> {
  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    include: {
      booking: {
        select: { clientId: true, consultantId: true },
      },
    },
  });

  if (!engagement) return { allowed: false };

  const isParticipant =
    engagement.booking.clientId === userId ||
    engagement.booking.consultantId === userId;

  return { allowed: isParticipant, engagement };
}

interface GetEngagementInput {
  engagementId: string;
}

export async function get(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { engagementId } = input as GetEngagementInput;
  const { allowed } = await verifyEngagementAccess(engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: engagementId },
    include: {
      booking: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          consultant: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          request: { select: { id: true, title: true, refinedSummary: true } },
        },
      },
      messages: { take: 10, orderBy: { createdAt: 'desc' } },
      checklistItems: { orderBy: { order: 'asc' } },
      transferPack: true,
    },
  });

  return { success: true, data: engagement };
}

interface ListEngagementsInput {
  status?: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'TRANSFERRED';
  page?: number;
  limit?: number;
}

export async function list(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const params = input as ListEngagementsInput;
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {
    booking: {
      OR: [
        { clientId: context.userId },
        { consultantId: context.userId },
      ],
    },
  };

  if (params.status) where.status = params.status;

  const [engagements, total] = await Promise.all([
    prisma.engagement.findMany({
      where,
      skip,
      take: limit,
      include: {
        booking: {
          include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            consultant: { select: { id: true, firstName: true, lastName: true } },
            request: { select: { id: true, title: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    }),
    prisma.engagement.count({ where }),
  ]);

  return {
    success: true,
    data: {
      items: engagements,
      total,
      page,
      limit,
      hasMore: skip + engagements.length < total,
    },
  };
}

interface UpdateEngagementInput {
  engagementId: string;
  agenda?: string;
  videoLink?: string;
  status?: 'ACTIVE' | 'PAUSED';
}

export async function update(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as UpdateEngagementInput;
  const { allowed } = await verifyEngagementAccess(data.engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const engagement = await prisma.engagement.update({
    where: { id: data.engagementId },
    data: {
      ...(data.agenda !== undefined && { agenda: data.agenda }),
      ...(data.videoLink !== undefined && { videoLink: data.videoLink }),
      ...(data.status !== undefined && { status: data.status }),
    },
  });

  return { success: true, data: engagement };
}

interface CompleteEngagementInput {
  engagementId: string;
}

export async function complete(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { engagementId } = input as CompleteEngagementInput;
  const { allowed } = await verifyEngagementAccess(engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const transferPack = await prisma.transferPack.findUnique({
    where: { engagementId },
  });

  if (!transferPack || !transferPack.isFinalized) {
    return {
      success: false,
      error: 'Transfer pack must be finalized before completing',
      code: 'TRANSFER_REQUIRED',
    };
  }

  const engagement = await prisma.engagement.update({
    where: { id: engagementId },
    data: {
      status: 'COMPLETED',
      endedAt: new Date(),
    },
  });

  await prisma.booking.update({
    where: { id: engagement.bookingId },
    data: { status: 'COMPLETED' },
  });

  return { success: true, data: engagement };
}

interface SendMessageInput {
  engagementId: string;
  content: string;
}

export async function sendMessage(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { engagementId, content } = input as SendMessageInput;
  const { allowed } = await verifyEngagementAccess(engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const message = await prisma.message.create({
    data: {
      engagementId,
      authorId: context.userId,
      content,
    },
    include: {
      author: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  return { success: true, data: message };
}

interface ListMessagesInput {
  engagementId: string;
  page?: number;
  limit?: number;
}

export async function listMessages(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const params = input as ListMessagesInput;
  const { allowed } = await verifyEngagementAccess(params.engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const page = params.page || 1;
  const limit = Math.min(params.limit || 50, 100);
  const skip = (page - 1) * limit;

  const [messages, total] = await Promise.all([
    prisma.message.findMany({
      where: { engagementId: params.engagementId },
      skip,
      take: limit,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
    prisma.message.count({ where: { engagementId: params.engagementId } }),
  ]);

  return {
    success: true,
    data: { items: messages, total, page, limit, hasMore: skip + messages.length < total },
  };
}

interface CreateNoteInput {
  engagementId: string;
  title?: string;
  content: string;
  isPrivate?: boolean;
}

export async function createNote(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as CreateNoteInput;
  const { allowed } = await verifyEngagementAccess(data.engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const note = await prisma.note.create({
    data: {
      engagementId: data.engagementId,
      authorId: context.userId,
      title: data.title,
      content: data.content,
      isPrivate: data.isPrivate ?? false,
    },
  });

  return { success: true, data: note };
}

interface ListNotesInput {
  engagementId: string;
  page?: number;
  limit?: number;
}

export async function listNotes(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const params = input as ListNotesInput;
  const { allowed } = await verifyEngagementAccess(params.engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where = {
    engagementId: params.engagementId,
    OR: [
      { isPrivate: false },
      { authorId: context.userId },
    ],
  };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      skip,
      take: limit,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.note.count({ where }),
  ]);

  return {
    success: true,
    data: { items: notes, total, page, limit, hasMore: skip + notes.length < total },
  };
}

interface UpdateNoteInput {
  noteId: string;
  title?: string;
  content?: string;
  isPrivate?: boolean;
}

export async function updateNote(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as UpdateNoteInput;

  const note = await prisma.note.findUnique({
    where: { id: data.noteId },
  });

  if (!note) {
    return { success: false, error: 'Note not found', code: 'NOT_FOUND' };
  }

  if (note.authorId !== context.userId) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const updated = await prisma.note.update({
    where: { id: data.noteId },
    data: {
      ...(data.title !== undefined && { title: data.title }),
      ...(data.content !== undefined && { content: data.content }),
      ...(data.isPrivate !== undefined && { isPrivate: data.isPrivate }),
    },
  });

  return { success: true, data: updated };
}

interface AddChecklistItemInput {
  engagementId: string;
  text: string;
}

export async function addChecklistItem(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { engagementId, text } = input as AddChecklistItemInput;
  const { allowed } = await verifyEngagementAccess(engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const maxOrder = await prisma.checklistItem.aggregate({
    where: { engagementId },
    _max: { order: true },
  });

  const item = await prisma.checklistItem.create({
    data: {
      engagementId,
      text,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return { success: true, data: item };
}

interface ToggleChecklistInput {
  itemId: string;
}

export async function toggleChecklistItem(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { itemId } = input as ToggleChecklistInput;

  const item = await prisma.checklistItem.findUnique({
    where: { id: itemId },
    include: { engagement: { include: { booking: true } } },
  });

  if (!item) {
    return { success: false, error: 'Item not found', code: 'NOT_FOUND' };
  }

  const isParticipant =
    item.engagement.booking.clientId === context.userId ||
    item.engagement.booking.consultantId === context.userId;

  if (!isParticipant) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const updated = await prisma.checklistItem.update({
    where: { id: itemId },
    data: { isCompleted: !item.isCompleted },
  });

  return { success: true, data: updated };
}

interface ListChecklistInput {
  engagementId: string;
}

export async function listChecklist(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { engagementId } = input as ListChecklistInput;
  const { allowed } = await verifyEngagementAccess(engagementId, context.userId);

  if (!allowed) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const items = await prisma.checklistItem.findMany({
    where: { engagementId },
    orderBy: { order: 'asc' },
  });

  return { success: true, data: items };
}
