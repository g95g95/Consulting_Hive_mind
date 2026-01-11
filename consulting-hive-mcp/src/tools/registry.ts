import type { ToolDefinition, ToolCategory } from '../types/index.js';
import * as userHandlers from './handlers/user.js';
import * as requestHandlers from './handlers/request.js';
import * as offerHandlers from './handlers/offer.js';
import * as engagementHandlers from './handlers/engagement.js';
import * as transferHandlers from './handlers/transfer.js';
import * as hiveHandlers from './handlers/hive.js';
import * as reviewHandlers from './handlers/review.js';
import * as adminHandlers from './handlers/admin.js';

export const tools: ToolDefinition[] = [
  // ============================================
  // USER & PROFILE (9 tools)
  // ============================================
  {
    name: 'user_authenticate',
    description: 'Exchange OAuth authorization code for JWT token',
    category: 'user',
    requiresAuth: false,
    inputSchema: {
      type: 'object',
      properties: {
        provider: { type: 'string', enum: ['google', 'linkedin'], description: 'OAuth provider' },
        code: { type: 'string', description: 'Authorization code from OAuth flow' },
      },
      required: ['provider', 'code'],
    },
    handler: userHandlers.authenticate,
  },
  {
    name: 'user_get_profile',
    description: 'Get the complete profile of the authenticated user',
    category: 'user',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {},
    },
    handler: userHandlers.getProfile,
  },
  {
    name: 'user_update_profile',
    description: 'Update basic user profile data',
    category: 'user',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', description: 'First name' },
        lastName: { type: 'string', description: 'Last name' },
        imageUrl: { type: 'string', description: 'Profile image URL' },
      },
    },
    handler: userHandlers.updateProfile,
  },
  {
    name: 'consultant_profile_create',
    description: 'Create a consultant profile for the authenticated user',
    category: 'user',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        headline: { type: 'string', description: 'Professional headline' },
        bio: { type: 'string', description: 'Professional bio' },
        hourlyRate: { type: 'number', description: 'Hourly rate in cents' },
        currency: { type: 'string', description: 'Currency code (default: EUR)' },
        languages: { type: 'array', items: { type: 'string' }, description: 'Languages spoken' },
        timezone: { type: 'string', description: 'Timezone (e.g., Europe/Rome)' },
        linkedinUrl: { type: 'string', description: 'LinkedIn profile URL' },
        portfolioUrl: { type: 'string', description: 'Portfolio/website URL' },
        yearsExperience: { type: 'number', description: 'Years of professional experience' },
        skills: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              level: { type: 'string', enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'] },
            },
          },
          description: 'Skills with proficiency levels',
        },
      },
    },
    handler: userHandlers.createConsultantProfile,
  },
  {
    name: 'consultant_profile_update',
    description: 'Update the authenticated user\'s consultant profile',
    category: 'user',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        bio: { type: 'string' },
        hourlyRate: { type: 'number' },
        isAvailable: { type: 'boolean' },
        consentDirectory: { type: 'boolean' },
        consentHiveMind: { type: 'boolean' },
      },
    },
    handler: userHandlers.updateConsultantProfile,
  },
  {
    name: 'client_profile_create',
    description: 'Create a client profile for the authenticated user',
    category: 'user',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        companyName: { type: 'string', description: 'Company name' },
        companyRole: { type: 'string', description: 'Role at company' },
        preferredLanguage: { type: 'string', description: 'Preferred language' },
        billingEmail: { type: 'string', description: 'Billing email' },
        billingAddress: { type: 'string', description: 'Billing address' },
        vatNumber: { type: 'string', description: 'VAT number' },
      },
    },
    handler: userHandlers.createClientProfile,
  },
  {
    name: 'client_profile_update',
    description: 'Update the authenticated user\'s client profile',
    category: 'user',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        companyName: { type: 'string' },
        companyRole: { type: 'string' },
        preferredLanguage: { type: 'string' },
        billingEmail: { type: 'string' },
        billingAddress: { type: 'string' },
        vatNumber: { type: 'string' },
      },
    },
    handler: userHandlers.updateClientProfile,
  },
  {
    name: 'consultant_directory_search',
    description: 'Search the consultant directory with filters',
    category: 'user',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        skills: { type: 'array', items: { type: 'string' }, description: 'Filter by skill names' },
        minRate: { type: 'number', description: 'Minimum hourly rate in cents' },
        maxRate: { type: 'number', description: 'Maximum hourly rate in cents' },
        languages: { type: 'array', items: { type: 'string' }, description: 'Filter by languages' },
        isAvailable: { type: 'boolean', description: 'Filter by availability' },
        page: { type: 'number', description: 'Page number (default: 1)' },
        limit: { type: 'number', description: 'Items per page (default: 20)' },
      },
    },
    handler: userHandlers.searchDirectory,
  },
  {
    name: 'consultant_get_by_id',
    description: 'Get detailed information about a specific consultant',
    category: 'user',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        consultantId: { type: 'string', description: 'Consultant profile ID' },
      },
      required: ['consultantId'],
    },
    handler: userHandlers.getConsultantById,
  },

  // ============================================
  // REQUEST MANAGEMENT (6 tools)
  // ============================================
  {
    name: 'request_create',
    description: 'Create a new consulting request',
    category: 'request',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Request title' },
        rawDescription: { type: 'string', description: 'Detailed description of the request' },
        constraints: { type: 'string', description: 'Any constraints or requirements' },
        desiredOutcome: { type: 'string', description: 'What you want to achieve' },
        urgency: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'], description: 'Urgency level' },
        budget: { type: 'number', description: 'Budget in cents' },
        currency: { type: 'string', description: 'Currency code (default: EUR)' },
        skills: { type: 'array', items: { type: 'string' }, description: 'Required skill names' },
      },
      required: ['title', 'rawDescription'],
    },
    handler: requestHandlers.create,
  },
  {
    name: 'request_get',
    description: 'Get details of a specific request',
    category: 'request',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
      },
      required: ['requestId'],
    },
    handler: requestHandlers.get,
  },
  {
    name: 'request_list',
    description: 'List requests (own requests for clients, public requests for consultants)',
    category: 'request',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['DRAFT', 'PUBLISHED', 'MATCHING', 'BOOKED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] },
        urgency: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
    handler: requestHandlers.list,
  },
  {
    name: 'request_update',
    description: 'Update an existing request',
    category: 'request',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
        title: { type: 'string' },
        rawDescription: { type: 'string' },
        constraints: { type: 'string' },
        desiredOutcome: { type: 'string' },
        urgency: { type: 'string', enum: ['LOW', 'NORMAL', 'HIGH', 'URGENT'] },
        budget: { type: 'number' },
        status: { type: 'string', enum: ['DRAFT', 'PUBLISHED'] },
      },
      required: ['requestId'],
    },
    handler: requestHandlers.update,
  },
  {
    name: 'request_refine',
    description: 'AI-powered: Refine and structure a messy request description',
    category: 'request',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID to refine' },
      },
      required: ['requestId'],
    },
    handler: requestHandlers.refine,
  },
  {
    name: 'request_cancel',
    description: 'Cancel a request',
    category: 'request',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID to cancel' },
        reason: { type: 'string', description: 'Cancellation reason' },
      },
      required: ['requestId'],
    },
    handler: requestHandlers.cancel,
  },

  // ============================================
  // MATCHING & OFFERS (5 tools)
  // ============================================
  {
    name: 'offer_create',
    description: 'Consultant creates an offer for a request',
    category: 'offer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID' },
        message: { type: 'string', description: 'Cover message' },
        proposedRate: { type: 'number', description: 'Proposed hourly rate in cents' },
      },
      required: ['requestId'],
    },
    handler: offerHandlers.create,
  },
  {
    name: 'offer_list',
    description: 'List offers (for a request or own offers)',
    category: 'offer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Filter by request ID' },
        status: { type: 'string', enum: ['PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'] },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
    handler: offerHandlers.list,
  },
  {
    name: 'offer_accept',
    description: 'Client accepts an offer (creates booking)',
    category: 'offer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        offerId: { type: 'string', description: 'Offer ID to accept' },
        scheduledStart: { type: 'string', description: 'ISO datetime for session start' },
        duration: { type: 'number', description: 'Duration in minutes' },
      },
      required: ['offerId'],
    },
    handler: offerHandlers.accept,
  },
  {
    name: 'offer_decline',
    description: 'Decline an offer',
    category: 'offer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        offerId: { type: 'string', description: 'Offer ID to decline' },
        reason: { type: 'string', description: 'Decline reason' },
      },
      required: ['offerId'],
    },
    handler: offerHandlers.decline,
  },
  {
    name: 'match_find_consultants',
    description: 'AI-powered: Find matching consultants for a request',
    category: 'offer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        requestId: { type: 'string', description: 'Request ID to match' },
        limit: { type: 'number', description: 'Maximum matches to return (default: 5)' },
      },
      required: ['requestId'],
    },
    handler: offerHandlers.findMatches,
  },

  // ============================================
  // ENGAGEMENT WORKSPACE (12 tools)
  // ============================================
  {
    name: 'engagement_get',
    description: 'Get details of an engagement',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string', description: 'Engagement ID' },
      },
      required: ['engagementId'],
    },
    handler: engagementHandlers.get,
  },
  {
    name: 'engagement_list',
    description: 'List user\'s engagements',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED', 'COMPLETED', 'TRANSFERRED'] },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
    handler: engagementHandlers.list,
  },
  {
    name: 'engagement_update',
    description: 'Update engagement details',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
        agenda: { type: 'string' },
        videoLink: { type: 'string' },
        status: { type: 'string', enum: ['ACTIVE', 'PAUSED'] },
      },
      required: ['engagementId'],
    },
    handler: engagementHandlers.update,
  },
  {
    name: 'engagement_complete',
    description: 'Complete an engagement (requires transfer pack)',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string', description: 'Engagement ID to complete' },
      },
      required: ['engagementId'],
    },
    handler: engagementHandlers.complete,
  },
  {
    name: 'message_send',
    description: 'Send a message in an engagement',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
        content: { type: 'string', description: 'Message content' },
      },
      required: ['engagementId', 'content'],
    },
    handler: engagementHandlers.sendMessage,
  },
  {
    name: 'message_list',
    description: 'List messages in an engagement',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
      required: ['engagementId'],
    },
    handler: engagementHandlers.listMessages,
  },
  {
    name: 'note_create',
    description: 'Create a note in an engagement',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        isPrivate: { type: 'boolean', description: 'Only visible to author' },
      },
      required: ['engagementId', 'content'],
    },
    handler: engagementHandlers.createNote,
  },
  {
    name: 'note_list',
    description: 'List notes in an engagement',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
      required: ['engagementId'],
    },
    handler: engagementHandlers.listNotes,
  },
  {
    name: 'note_update',
    description: 'Update a note',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        noteId: { type: 'string' },
        title: { type: 'string' },
        content: { type: 'string' },
        isPrivate: { type: 'boolean' },
      },
      required: ['noteId'],
    },
    handler: engagementHandlers.updateNote,
  },
  {
    name: 'checklist_add_item',
    description: 'Add an item to the engagement checklist',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
        text: { type: 'string', description: 'Checklist item text' },
      },
      required: ['engagementId', 'text'],
    },
    handler: engagementHandlers.addChecklistItem,
  },
  {
    name: 'checklist_toggle_item',
    description: 'Toggle completion status of a checklist item',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        itemId: { type: 'string', description: 'Checklist item ID' },
      },
      required: ['itemId'],
    },
    handler: engagementHandlers.toggleChecklistItem,
  },
  {
    name: 'checklist_list',
    description: 'List checklist items for an engagement',
    category: 'engagement',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
      },
      required: ['engagementId'],
    },
    handler: engagementHandlers.listChecklist,
  },

  // ============================================
  // KNOWLEDGE TRANSFER (4 tools)
  // ============================================
  {
    name: 'transfer_pack_generate',
    description: 'AI-powered: Generate a knowledge transfer pack from engagement data',
    category: 'transfer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string', description: 'Engagement ID' },
      },
      required: ['engagementId'],
    },
    handler: transferHandlers.generate,
  },
  {
    name: 'transfer_pack_get',
    description: 'Get the transfer pack for an engagement',
    category: 'transfer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
      },
      required: ['engagementId'],
    },
    handler: transferHandlers.get,
  },
  {
    name: 'transfer_pack_update',
    description: 'Manually update transfer pack content',
    category: 'transfer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
        summary: { type: 'string' },
        keyDecisions: { type: 'string' },
        runbook: { type: 'string' },
        nextSteps: { type: 'string' },
        internalizationChecklist: { type: 'string' },
      },
      required: ['engagementId'],
    },
    handler: transferHandlers.update,
  },
  {
    name: 'transfer_pack_finalize',
    description: 'Finalize transfer pack and close engagement',
    category: 'transfer',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
      },
      required: ['engagementId'],
    },
    handler: transferHandlers.finalize,
  },

  // ============================================
  // HIVE LIBRARY (6 tools)
  // ============================================
  {
    name: 'hive_search',
    description: 'Search the Hive library for patterns, prompts, and stacks',
    category: 'hive',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['pattern', 'prompt', 'stack'], description: 'Content type' },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        query: { type: 'string', description: 'Search query' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
    handler: hiveHandlers.search,
  },
  {
    name: 'hive_pattern_get',
    description: 'Get details of a specific pattern',
    category: 'hive',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        patternId: { type: 'string' },
      },
      required: ['patternId'],
    },
    handler: hiveHandlers.getPattern,
  },
  {
    name: 'hive_prompt_get',
    description: 'Get details of a specific prompt',
    category: 'hive',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        promptId: { type: 'string' },
      },
      required: ['promptId'],
    },
    handler: hiveHandlers.getPrompt,
  },
  {
    name: 'hive_stack_get',
    description: 'Get details of a specific stack template',
    category: 'hive',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        stackId: { type: 'string' },
      },
      required: ['stackId'],
    },
    handler: hiveHandlers.getStack,
  },
  {
    name: 'hive_contribute',
    description: 'AI-powered: Contribute content to the Hive (with automatic PII redaction)',
    category: 'hive',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['pattern', 'prompt', 'stack'], description: 'Content type' },
        title: { type: 'string' },
        description: { type: 'string' },
        content: { type: 'string', description: 'Raw content (will be redacted)' },
        category: { type: 'string' },
        tags: { type: 'array', items: { type: 'string' } },
        engagementId: { type: 'string', description: 'Optional: linked engagement' },
      },
      required: ['type', 'title', 'content'],
    },
    handler: hiveHandlers.contribute,
  },
  {
    name: 'hive_refine_contribution',
    description: 'AI-powered: Refine and improve a pending contribution',
    category: 'hive',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        contributionId: { type: 'string' },
        type: { type: 'string', enum: ['pattern', 'prompt', 'stack'] },
        feedback: { type: 'string', description: 'Improvement feedback' },
      },
      required: ['contributionId', 'type'],
    },
    handler: hiveHandlers.refineContribution,
  },

  // ============================================
  // REVIEWS (2 tools)
  // ============================================
  {
    name: 'review_create',
    description: 'Create a review for a completed engagement',
    category: 'review',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        engagementId: { type: 'string' },
        rating: { type: 'number', minimum: 1, maximum: 5, description: 'Rating 1-5' },
        comment: { type: 'string' },
        isPublic: { type: 'boolean', description: 'Make review public (default: true)' },
      },
      required: ['engagementId', 'rating'],
    },
    handler: reviewHandlers.create,
  },
  {
    name: 'review_list',
    description: 'List reviews for a user or engagement',
    category: 'review',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        userId: { type: 'string', description: 'Filter by user ID' },
        engagementId: { type: 'string', description: 'Filter by engagement ID' },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
    handler: reviewHandlers.list,
  },

  // ============================================
  // ADMIN (3 tools)
  // ============================================
  {
    name: 'admin_moderation_queue',
    description: 'Get pending items for moderation (admin only)',
    category: 'admin',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['pattern', 'prompt', 'stack', 'all'] },
        page: { type: 'number' },
        limit: { type: 'number' },
      },
    },
    handler: adminHandlers.getModerationQueue,
  },
  {
    name: 'admin_approve_contribution',
    description: 'Approve a pending contribution (admin only)',
    category: 'admin',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        contributionId: { type: 'string' },
        type: { type: 'string', enum: ['pattern', 'prompt', 'stack'] },
      },
      required: ['contributionId', 'type'],
    },
    handler: adminHandlers.approve,
  },
  {
    name: 'admin_reject_contribution',
    description: 'Reject a pending contribution (admin only)',
    category: 'admin',
    requiresAuth: true,
    inputSchema: {
      type: 'object',
      properties: {
        contributionId: { type: 'string' },
        type: { type: 'string', enum: ['pattern', 'prompt', 'stack'] },
        reason: { type: 'string', description: 'Rejection reason' },
      },
      required: ['contributionId', 'type', 'reason'],
    },
    handler: adminHandlers.reject,
  },
];

export function getToolByName(name: string): ToolDefinition | undefined {
  return tools.find((t) => t.name === name);
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return tools.filter((t) => t.category === category);
}

export function getAllToolNames(): string[] {
  return tools.map((t) => t.name);
}

export function getToolSchemas(): Record<string, unknown>[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  }));
}
