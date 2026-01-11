import type { AuthContext, ToolResult } from '../../types/index.js';
import prisma from '../../db/client.js';

interface CreateReviewInput {
  engagementId: string;
  rating: number;
  comment?: string;
  isPublic?: boolean;
}

export async function create(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as CreateReviewInput;

  if (data.rating < 1 || data.rating > 5) {
    return { success: false, error: 'Rating must be between 1 and 5', code: 'INVALID_INPUT' };
  }

  const engagement = await prisma.engagement.findUnique({
    where: { id: data.engagementId },
    include: { booking: true },
  });

  if (!engagement) {
    return { success: false, error: 'Engagement not found', code: 'NOT_FOUND' };
  }

  if (engagement.status !== 'COMPLETED' && engagement.status !== 'TRANSFERRED') {
    return { success: false, error: 'Engagement must be completed', code: 'INVALID_STATUS' };
  }

  const isClient = engagement.booking.clientId === context.userId;
  const isConsultant = engagement.booking.consultantId === context.userId;

  if (!isClient && !isConsultant) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  const reviewType = isClient ? 'CLIENT_TO_CONSULTANT' : 'CONSULTANT_TO_CLIENT';
  const targetId = isClient ? engagement.booking.consultantId : engagement.booking.clientId;

  const existingReview = await prisma.review.findUnique({
    where: {
      engagementId_authorId_type: {
        engagementId: data.engagementId,
        authorId: context.userId,
        type: reviewType,
      },
    },
  });

  if (existingReview) {
    return { success: false, error: 'Review already exists', code: 'ALREADY_EXISTS' };
  }

  const review = await prisma.review.create({
    data: {
      engagementId: data.engagementId,
      authorId: context.userId,
      targetId,
      type: reviewType,
      rating: data.rating,
      comment: data.comment,
      isPublic: data.isPublic ?? true,
    },
  });

  return { success: true, data: review };
}

interface ListReviewsInput {
  userId?: string;
  engagementId?: string;
  page?: number;
  limit?: number;
}

export async function list(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const params = input as ListReviewsInput;
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 50);
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { isPublic: true };

  if (params.userId) {
    where.targetId = params.userId;
  }

  if (params.engagementId) {
    const engagement = await prisma.engagement.findUnique({
      where: { id: params.engagementId },
      include: { booking: true },
    });

    if (!engagement) {
      return { success: false, error: 'Engagement not found', code: 'NOT_FOUND' };
    }

    const isParticipant =
      engagement.booking.clientId === context.userId ||
      engagement.booking.consultantId === context.userId;

    if (!isParticipant) {
      return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
    }

    where.engagementId = params.engagementId;
    delete where.isPublic;
  }

  const [reviews, total] = await Promise.all([
    prisma.review.findMany({
      where,
      skip,
      take: limit,
      include: {
        author: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
        target: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.review.count({ where }),
  ]);

  return {
    success: true,
    data: { items: reviews, total, page, limit, hasMore: skip + reviews.length < total },
  };
}
