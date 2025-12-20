/**
 * Matcher Agent - Specializes in consultant-to-request matching
 *
 * Responsibilities:
 * - Search for consultants matching request criteria
 * - Calculate match scores based on multiple factors
 * - Generate human-readable explanations for matches
 * - Provide recommendations for the client
 */

import {
  generateCompletion,
  parseJsonFromResponse,
} from "../providers";
import { db } from "@/lib/db";

export interface MatchResult {
  consultantId: string;
  consultantName: string;
  score: number;
  reason: string;
  skillOverlap: string[];
  highlights: string[];
}

export interface MatchingResult {
  matches: MatchResult[];
  searchCriteria: {
    skills: string[];
    budget?: number;
    availability?: string;
  };
  recommendations: string;
  totalCandidates: number;
}

const MATCHER_SYSTEM_PROMPT = `You are an expert matching specialist for a consulting platform called "Consulting Hive Mind".

Your job is to find the BEST consultant matches for client requests. Quality over quantity - it's better to return 3 excellent matches than 10 mediocre ones.

## Matching Criteria (in order of importance):

1. **Skill Overlap** (50% of score)
   - Direct skill matches are most important
   - Related skills count but less
   - More overlapping skills = higher score

2. **Experience Level** (20% of score)
   - Check consultant headlines and bios for relevant experience
   - Look for specific domain expertise
   - Consider years of experience if mentioned

3. **Rating & Reviews** (15% of score)
   - Higher ratings indicate better quality
   - Consider number of completed engagements

4. **Availability & Rate** (15% of score)
   - Match budget constraints if specified
   - Consider availability windows

## Score Ranges:
- 90-100: Excellent match - consultant is nearly perfect for this request
- 70-89: Good match - strong alignment with minor gaps
- 50-69: Moderate match - some relevant skills but significant gaps
- Below 50: Weak match - not recommended

## Explanation Guidelines:
- Be specific about WHY this consultant matches
- Mention specific skills that align
- Note any potential gaps or concerns
- Keep explanations to 2-3 sentences

## Output Format

Always respond with valid JSON:
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
  "searchCriteria": {
    "skills": ["skills searched"],
    "budget": null,
    "availability": null
  },
  "recommendations": "General advice for the client",
  "totalCandidates": 10
}`;

export class MatcherAgent {
  /**
   * Find and score consultant matches for a request
   */
  async findMatches(
    requestId: string,
    requestDetails: {
      title?: string;
      summary?: string;
      skills?: string[];
      desiredOutcome?: string;
      budget?: number;
    }
  ): Promise<MatchingResult> {
    // First, fetch potential consultants from database
    const consultants = await this.searchConsultantsFromDB(
      requestDetails.skills || [],
      requestDetails.budget
    );

    if (consultants.length === 0) {
      return {
        matches: [],
        searchCriteria: {
          skills: requestDetails.skills || [],
          budget: requestDetails.budget,
        },
        recommendations: "No consultants found matching the criteria. Consider broadening your skill requirements.",
        totalCandidates: 0,
      };
    }

    // Build context for AI matching
    const consultantContext = consultants.map((c) => ({
      id: c.id,
      name: c.user?.firstName || "Unknown",
      headline: c.headline,
      bio: c.bio,
      skills: c.skills?.map((s) => s.skillTag?.name).filter(Boolean) || [],
      hourlyRate: c.hourlyRate,
    }));

    const response = await generateCompletion({
      systemPrompt: MATCHER_SYSTEM_PROMPT,
      userMessage: `Find the best matches for this consultation request:

Request ID: ${requestId}
Title: ${requestDetails.title || "Not specified"}
Summary: ${requestDetails.summary || "Not specified"}
Required Skills: ${JSON.stringify(requestDetails.skills || [])}
Desired Outcome: ${requestDetails.desiredOutcome || "Not specified"}
Budget: ${requestDetails.budget ? `$${requestDetails.budget}/hour max` : "Not specified"}

Available Consultants:
${JSON.stringify(consultantContext, null, 2)}

Analyze each consultant and return the top matches with scores and explanations.`,
      temperature: 0.5,
      maxTokens: 2000,
    });

    const defaultResult: MatchingResult = {
      matches: [],
      searchCriteria: {
        skills: requestDetails.skills || [],
        budget: requestDetails.budget,
      },
      recommendations: "",
      totalCandidates: consultants.length,
    };

    return parseJsonFromResponse(response.text, defaultResult);
  }

  /**
   * Calculate match score for a single consultant-request pair
   */
  async calculateScore(
    requestDetails: {
      title: string;
      summary: string;
      skills: string[];
      desiredOutcome: string;
    },
    consultantDetails: {
      id: string;
      name: string;
      headline: string;
      bio: string;
      skills: string[];
      rating: number;
    }
  ): Promise<{ score: number; reason: string }> {
    const response = await generateCompletion({
      systemPrompt: `You are a matching expert. Calculate a match score (0-100) and explain why.

Output JSON:
{
  "score": 0-100,
  "reason": "2-3 sentence explanation"
}`,
      userMessage: `Request:
Title: ${requestDetails.title}
Summary: ${requestDetails.summary}
Skills: ${requestDetails.skills.join(", ")}
Outcome: ${requestDetails.desiredOutcome}

Consultant:
Name: ${consultantDetails.name}
Headline: ${consultantDetails.headline}
Bio: ${consultantDetails.bio}
Skills: ${consultantDetails.skills.join(", ")}
Rating: ${consultantDetails.rating}/5`,
      temperature: 0.5,
      maxTokens: 300,
    });

    return parseJsonFromResponse(response.text, {
      score: 50,
      reason: "Unable to calculate match score.",
    });
  }

  /**
   * Search consultants from database
   */
  private async searchConsultantsFromDB(skills: string[], maxRate?: number) {
    return db.consultantProfile.findMany({
      where: {
        AND: [
          skills.length > 0
            ? {
                skills: {
                  some: {
                    skillTag: {
                      name: { in: skills },
                    },
                  },
                },
              }
            : {},
          maxRate ? { hourlyRate: { lte: maxRate } } : {},
        ],
      },
      include: {
        user: true,
        skills: { include: { skillTag: true } },
      },
      take: 20,
    });
  }
}

// Singleton instance
let matcherAgentInstance: MatcherAgent | null = null;

export function getMatcherAgent(): MatcherAgent {
  if (!matcherAgentInstance) {
    matcherAgentInstance = new MatcherAgent();
  }
  return matcherAgentInstance;
}
