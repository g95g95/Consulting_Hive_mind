import { z } from "zod";

export const createRequestSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  rawDescription: z.string().min(1, "Description is required").max(10000),
  refinedSummary: z.string().max(5000).optional().nullable(),
  constraints: z.string().max(5000).optional().nullable(),
  desiredOutcome: z.string().max(5000).optional().nullable(),
  suggestedDuration: z.number().int().min(15).max(480).optional(),
  urgency: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
  budget: z.union([z.string(), z.number()]).optional().nullable(),
  selectedSkills: z.array(z.string()).optional(),
  sensitiveData: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  consultantId: z.string().uuid().optional(),
});

export const createOfferSchema = z.object({
  requestId: z.string().uuid("Invalid request ID"),
  message: z.string().max(2000).optional(),
  proposedRate: z.union([z.string(), z.number()]).optional(),
});

export const hiveContributionSchema = z.object({
  type: z.enum(["pattern", "prompt", "stack"]),
  title: z.string().min(1, "Title is required").max(200),
  description: z.string().max(2000).optional(),
  content: z.string().min(1, "Content is required").max(50000),
  useCase: z.string().max(1000).optional(),
  tags: z.array(z.string()).max(10).optional(),
  uiTech: z.string().max(100).optional().nullable(),
  backendTech: z.string().max(100).optional().nullable(),
  databaseTech: z.string().max(100).optional().nullable(),
  releaseTech: z.string().max(100).optional().nullable(),
});

export const aiOrchestrateSchema = z.object({
  intent: z.enum([
    "refine_request",
    "match_consultants",
    "generate_transfer_pack",
    "redact_content",
    "search_hive",
    "refine_contribution",
  ]).optional(),
  context: z.record(z.string(), z.unknown()),
});

export const createReviewSchema = z.object({
  engagementId: z.string().uuid("Invalid engagement ID"),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
  type: z.enum(["CLIENT_TO_CONSULTANT", "CONSULTANT_TO_CLIENT"]),
});

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
});

export const consultantProfileSchema = z.object({
  headline: z.string().max(200).optional(),
  bio: z.string().max(5000).optional(),
  hourlyRate: z.number().int().min(0).max(100000).optional(),
  languages: z.array(z.string()).max(20).optional(),
  linkedinUrl: z.string().url().optional().nullable(),
  websiteUrl: z.string().url().optional().nullable(),
  yearsExperience: z.number().int().min(0).max(70).optional(),
  selectedSkills: z.array(z.string()).max(50).optional(),
  consentDirectory: z.boolean().optional(),
  consentHive: z.boolean().optional(),
});

export const clientProfileSchema = z.object({
  companyName: z.string().max(200).optional(),
  companySize: z.string().max(50).optional(),
  industry: z.string().max(100).optional(),
  billingAddress: z.string().max(500).optional(),
  vatNumber: z.string().max(50).optional(),
});

export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: true;
  data: T
} | {
  success: false;
  error: string
} {
  const result = schema.safeParse(data);
  if (!result.success) {
    const firstIssue = result.error.issues[0];
    return {
      success: false,
      error: firstIssue?.message || "Validation failed"
    };
  }
  return { success: true, data: result.data };
}
