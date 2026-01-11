import { generateCompletion, parseJsonFromResponse } from '../providers/gemini.js';
import prisma from '../db/client.js';

export interface MatchResult {
  consultantId: string;
  consultantName: string;
  score: number;
  reason: string;
  skillOverlap: string[];
  highlights: string[];
}

const MATCHER_SYSTEM_PROMPT = `You are an expert matching specialist for "Consulting Hive Mind".

Find the BEST consultant matches for client requests. Quality over quantity.

## Matching Criteria (importance):
1. Skill Overlap (50%) - Direct skill matches most important
2. Experience Level (20%) - Check headlines/bios for relevant experience
3. Rating & Reviews (15%) - Higher ratings indicate better quality
4. Availability & Rate (15%) - Match budget constraints

## Score Ranges:
- 90-100: Excellent match
- 70-89: Good match with minor gaps
- 50-69: Moderate match with significant gaps
- Below 50: Weak match - not recommended

## Output Format (JSON):
{
  "matches": [
    {
      "consultantId": "id",
      "consultantName": "Name",
      "score": 85,
      "reason": "Why this is a good match...",
      "skillOverlap": ["Skill1", "Skill2"],
      "highlights": ["Key strength 1", "Key strength 2"]
    }
  ],
  "recommendations": "General advice for the client"
}`;

interface RequestData {
  id: string;
  title: string;
  refinedSummary?: string | null;
  rawDescription: string;
  budget?: number | null;
  skills?: Array<{ skillTag: { name: string } }>;
}

export async function findMatchingConsultants(
  request: RequestData,
  limit: number = 5
): Promise<MatchResult[]> {
  const skillNames = request.skills?.map(s => s.skillTag.name) || [];

  const consultants = await prisma.consultantProfile.findMany({
    where: {
      consentDirectory: true,
      isAvailable: true,
      ...(skillNames.length > 0 && {
        skills: {
          some: {
            skillTag: {
              name: { in: skillNames },
            },
          },
        },
      }),
      ...(request.budget && { hourlyRate: { lte: request.budget } }),
    },
    include: {
      user: { select: { firstName: true, lastName: true } },
      skills: { include: { skillTag: true } },
    },
    take: 20,
  });

  if (consultants.length === 0) {
    return [];
  }

  const consultantContext = consultants.map(c => ({
    id: c.id,
    name: `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || 'Unknown',
    headline: c.headline,
    bio: c.bio,
    skills: c.skills.map(s => s.skillTag.name),
    hourlyRate: c.hourlyRate,
  }));

  const response = await generateCompletion({
    systemPrompt: MATCHER_SYSTEM_PROMPT,
    userMessage: `Find the best matches for this request:

Request ID: ${request.id}
Title: ${request.title}
Summary: ${request.refinedSummary || request.rawDescription}
Required Skills: ${JSON.stringify(skillNames)}
Budget: ${request.budget ? `€${request.budget / 100}/hour max` : 'Not specified'}

Available Consultants:
${JSON.stringify(consultantContext, null, 2)}

Return the top ${limit} matches with scores and explanations.`,
    temperature: 0.5,
    maxTokens: 2000,
  });

  const result = parseJsonFromResponse(response.text, { matches: [] });
  return (result.matches || []).slice(0, limit);
}
