import type { AuthContext, ToolResult } from '../../types/index.js';
import prisma from '../../db/client.js';
import { findMatchingConsultants } from '../../agents/matcher.js';

interface CreateOfferInput {
  requestId: string;
  message?: string;
  proposedRate?: number;
}

export async function create(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const data = input as CreateOfferInput;

  const consultantProfile = await prisma.consultantProfile.findUnique({
    where: { userId: context.userId },
  });

  if (!consultantProfile) {
    return { success: false, error: 'Consultant profile required', code: 'NO_PROFILE' };
  }

  const request = await prisma.request.findUnique({
    where: { id: data.requestId },
  });

  if (!request) {
    return { success: false, error: 'Request not found', code: 'NOT_FOUND' };
  }

  if (!request.isPublic || request.status !== 'PUBLISHED') {
    return { success: false, error: 'Request not available for offers', code: 'INVALID_STATUS' };
  }

  if (request.creatorId === context.userId) {
    return { success: false, error: 'Cannot offer on your own request', code: 'SELF_OFFER' };
  }

  const existingOffer = await prisma.offer.findUnique({
    where: {
      requestId_consultantId: {
        requestId: data.requestId,
        consultantId: consultantProfile.id,
      },
    },
  });

  if (existingOffer) {
    return { success: false, error: 'Offer already exists', code: 'ALREADY_EXISTS' };
  }

  const offer = await prisma.offer.create({
    data: {
      requestId: data.requestId,
      consultantId: consultantProfile.id,
      message: data.message,
      proposedRate: data.proposedRate || consultantProfile.hourlyRate,
      status: 'PENDING',
    },
  });

  return { success: true, data: offer };
}

interface ListOffersInput {
  requestId?: string;
  status?: 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'WITHDRAWN';
  page?: number;
  limit?: number;
}

export async function list(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const params = input as ListOffersInput;
  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 50);
  const skip = (page - 1) * limit;

  const consultantProfile = await prisma.consultantProfile.findUnique({
    where: { userId: context.userId },
  });

  const where: Record<string, unknown> = {};

  if (params.requestId) {
    const request = await prisma.request.findUnique({
      where: { id: params.requestId },
    });

    if (!request) {
      return { success: false, error: 'Request not found', code: 'NOT_FOUND' };
    }

    if (request.creatorId !== context.userId) {
      return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
    }

    where.requestId = params.requestId;
  } else if (consultantProfile) {
    where.consultantId = consultantProfile.id;
  } else {
    where.request = { creatorId: context.userId };
  }

  if (params.status) where.status = params.status;

  const [offers, total] = await Promise.all([
    prisma.offer.findMany({
      where,
      skip,
      take: limit,
      include: {
        request: { select: { id: true, title: true, status: true } },
        consultant: {
          include: {
            user: { select: { id: true, firstName: true, lastName: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.offer.count({ where }),
  ]);

  return {
    success: true,
    data: {
      items: offers,
      total,
      page,
      limit,
      hasMore: skip + offers.length < total,
    },
  };
}

interface AcceptOfferInput {
  offerId: string;
  scheduledStart?: string;
  duration?: number;
}

export async function accept(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { offerId, scheduledStart, duration } = input as AcceptOfferInput;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: {
      request: true,
      consultant: { include: { user: true } },
    },
  });

  if (!offer) {
    return { success: false, error: 'Offer not found', code: 'NOT_FOUND' };
  }

  if (offer.request.creatorId !== context.userId) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  if (offer.status !== 'PENDING') {
    return { success: false, error: 'Offer not pending', code: 'INVALID_STATUS' };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updatedOffer = await tx.offer.update({
      where: { id: offerId },
      data: { status: 'ACCEPTED' },
    });

    await tx.offer.updateMany({
      where: {
        requestId: offer.requestId,
        id: { not: offerId },
        status: 'PENDING',
      },
      data: { status: 'DECLINED' },
    });

    await tx.request.update({
      where: { id: offer.requestId },
      data: { status: 'BOOKED' },
    });

    const booking = await tx.booking.create({
      data: {
        requestId: offer.requestId,
        clientId: context.userId,
        consultantId: offer.consultant.userId,
        scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
        duration: duration || offer.request.suggestedDuration || 60,
        status: 'PENDING',
      },
    });

    const engagement = await tx.engagement.create({
      data: {
        bookingId: booking.id,
        status: 'ACTIVE',
      },
    });

    return { offer: updatedOffer, booking, engagement };
  });

  return { success: true, data: result };
}

interface DeclineOfferInput {
  offerId: string;
  reason?: string;
}

export async function decline(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { offerId, reason } = input as DeclineOfferInput;

  const offer = await prisma.offer.findUnique({
    where: { id: offerId },
    include: { request: true, consultant: true },
  });

  if (!offer) {
    return { success: false, error: 'Offer not found', code: 'NOT_FOUND' };
  }

  const isClient = offer.request.creatorId === context.userId;
  const isConsultant = offer.consultant.userId === context.userId;

  if (!isClient && !isConsultant) {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  if (offer.status !== 'PENDING') {
    return { success: false, error: 'Offer not pending', code: 'INVALID_STATUS' };
  }

  const status = isConsultant ? 'WITHDRAWN' : 'DECLINED';

  const updated = await prisma.offer.update({
    where: { id: offerId },
    data: { status },
  });

  await prisma.auditLog.create({
    data: {
      userId: context.userId,
      action: isConsultant ? 'OFFER_WITHDRAWN' : 'OFFER_DECLINED',
      entity: 'Offer',
      entityId: offerId,
      metadata: { reason },
    },
  });

  return { success: true, data: updated };
}

interface FindMatchesInput {
  requestId: string;
  limit?: number;
}

export async function findMatches(input: unknown, context: AuthContext | null): Promise<ToolResult> {
  if (!context) return { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' };

  const { requestId, limit = 5 } = input as FindMatchesInput;

  const request = await prisma.request.findUnique({
    where: { id: requestId },
    include: {
      skills: { include: { skillTag: true } },
    },
  });

  if (!request) {
    return { success: false, error: 'Request not found', code: 'NOT_FOUND' };
  }

  if (request.creatorId !== context.userId && context.role !== 'ADMIN') {
    return { success: false, error: 'Access denied', code: 'FORBIDDEN' };
  }

  try {
    const matches = await findMatchingConsultants(request, limit);

    return {
      success: true,
      data: {
        request: { id: request.id, title: request.title },
        matches,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to find matches',
      code: 'AI_ERROR',
    };
  }
}
