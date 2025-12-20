/**
 * Hive Contribution Agent - Specializes in refining hive library contributions
 *
 * Responsibilities:
 * - Improve title and description quality
 * - Suggest appropriate tags from taxonomy
 * - Structure content for clarity and usefulness
 * - Ensure contribution is complete and valuable
 * - Categorize correctly (Pattern vs Prompt vs Stack)
 *
 * Philosophy: Help users contribute high-quality knowledge that benefits the whole hive.
 */

import {
  generateCompletion,
  parseJsonFromResponse,
} from "../providers";

export interface HiveContributionResult {
  // Refined metadata
  refinedTitle: string;
  refinedDescription: string;
  suggestedTags: string[];
  suggestedCategory: string;

  // Refined content
  refinedContent: string;

  // For Stack Templates only
  stackMetadata?: {
    uiTech: string | null;
    backendTech: string | null;
    databaseTech: string | null;
    releaseTech: string | null;
  };

  // Quality assessment
  qualityScore: number; // 0-100
  improvements: string[]; // What was improved
  suggestions: string[]; // Additional suggestions for the contributor
  isReadyForSubmission: boolean;
  confidence: "high" | "medium" | "low";
}

export type ContributionType = "pattern" | "prompt" | "stack";

const HIVE_CONTRIBUTION_SYSTEM_PROMPT = `You are a knowledge curator for the Consulting Hive Mind platform's shared library.

Your job is to help contributors refine their submissions to ensure they are high-quality, well-structured, and valuable to other members.

## Your Goals

1. **Improve Clarity**: Make titles and descriptions clear and searchable
2. **Structure Content**: Ensure content follows best practices for the type
3. **Suggest Tags**: Recommend relevant tags from the platform taxonomy
4. **Assess Quality**: Evaluate if the contribution is ready for the library

## Content Type Guidelines

### Patterns
A good pattern should have:
- **Problem**: Clear description of the problem it solves
- **Solution**: The pattern/approach
- **Implementation**: Code examples or step-by-step instructions
- **Results/Benefits**: What outcomes to expect
- **When to Use**: Applicability context

### Prompts
A good prompt should have:
- **Purpose**: What task it accomplishes
- **Structure**: Clear sections and placeholders like [DESCRIPTION]
- **Output Format**: What the AI should return
- **Examples**: Optional but helpful

### Stack Templates
A good stack template should have:
- **Overview**: What type of project it's for
- **Components**: Breakdown by layer (frontend, backend, database, infra)
- **Why These Choices**: Rationale for technology selection
- **Setup Instructions**: How to get started
- **Cost Estimates**: If applicable
- **Scaling Considerations**: Growth path

## Tag Taxonomy

Only suggest tags from these categories:

**AI/ML**: LLMs, Machine Learning, MLOps, Computer Vision, NLP, RAG Systems, AI Agents, Prompt Engineering
**Data**: Data Engineering, Data Science, Analytics, Data Visualization, ETL/ELT
**Infrastructure**: Cloud Architecture, AWS, GCP, Azure, Kubernetes, DevOps, Platform Engineering
**Security**: Security Architecture, Penetration Testing, Compliance, Identity Management
**Engineering**: Backend Development, Frontend Development, Full-Stack Development, API Design, System Design, Code Review, TypeScript, Python, Go, Rust
**Product**: Product Architecture, Technical Strategy, Technical Due Diligence, Roadmap Planning
**Enterprise**: ERP Integration, SAP, Salesforce, Legacy Modernization
**Practices**: Testing, TDD, CI/CD, Monitoring, Performance, Scalability

## Output Format

Always respond with valid JSON:
{
  "refinedTitle": "Clear, descriptive title (max 60 chars)",
  "refinedDescription": "2-3 sentence description of what this is and why it's useful",
  "suggestedTags": ["Tag1", "Tag2", "Tag3"],
  "suggestedCategory": "AI/ML | Data | Infrastructure | Security | Engineering | Product | Enterprise",
  "refinedContent": "The improved/structured content",
  "stackMetadata": { // Only for stack type
    "uiTech": "Frontend technologies",
    "backendTech": "Backend technologies",
    "databaseTech": "Database technologies",
    "releaseTech": "Deployment technologies"
  },
  "qualityScore": 0-100,
  "improvements": ["What you improved"],
  "suggestions": ["Additional suggestions for the contributor"],
  "isReadyForSubmission": true | false,
  "confidence": "high" | "medium" | "low"
}

## Quality Score Guidelines

- **90-100**: Excellent - ready for immediate approval
- **70-89**: Good - minor improvements suggested
- **50-69**: Needs work - significant improvements needed
- **Below 50**: Incomplete - major sections missing`;

export class HiveContributionAgent {
  /**
   * Refine a contribution for the hive library
   */
  async refine(
    type: ContributionType,
    input: {
      title: string;
      description?: string;
      content: string;
      tags?: string[];
      // Stack-specific
      uiTech?: string;
      backendTech?: string;
      databaseTech?: string;
      releaseTech?: string;
    }
  ): Promise<HiveContributionResult> {
    const typeLabel = type === "stack" ? "Stack Template" : type.charAt(0).toUpperCase() + type.slice(1);

    let stackContext = "";
    if (type === "stack") {
      stackContext = `
Current Stack Metadata:
- UI/Frontend: ${input.uiTech || "Not specified"}
- Backend: ${input.backendTech || "Not specified"}
- Database: ${input.databaseTech || "Not specified"}
- Release/Deploy: ${input.releaseTech || "Not specified"}
`;
    }

    const response = await generateCompletion({
      systemPrompt: HIVE_CONTRIBUTION_SYSTEM_PROMPT,
      userMessage: `Please refine this ${typeLabel} contribution for the hive library:

## Current Title
${input.title}

## Current Description
${input.description || "No description provided"}

## Current Tags
${input.tags?.join(", ") || "No tags provided"}
${stackContext}
## Content
${input.content}

---

Analyze this contribution and provide a refined version with improvements.
For the refinedContent, keep the core ideas but improve structure, clarity, and completeness.
${type === "stack" ? "Also extract and normalize the stack metadata (uiTech, backendTech, databaseTech, releaseTech)." : ""}`,
      temperature: 0.6,
      maxTokens: 4000,
    });

    const defaultResult: HiveContributionResult = {
      refinedTitle: input.title,
      refinedDescription: input.description || "",
      suggestedTags: input.tags || [],
      suggestedCategory: "Engineering",
      refinedContent: input.content,
      qualityScore: 50,
      improvements: [],
      suggestions: ["Unable to analyze contribution"],
      isReadyForSubmission: false,
      confidence: "low",
    };

    if (type === "stack") {
      defaultResult.stackMetadata = {
        uiTech: input.uiTech || null,
        backendTech: input.backendTech || null,
        databaseTech: input.databaseTech || null,
        releaseTech: input.releaseTech || null,
      };
    }

    return parseJsonFromResponse(response.text, defaultResult);
  }

  /**
   * Quick quality check without full refinement
   */
  async assessQuality(
    type: ContributionType,
    content: string
  ): Promise<{
    score: number;
    issues: string[];
    isAcceptable: boolean;
  }> {
    const response = await generateCompletion({
      systemPrompt: `You are a quality assessor for a knowledge library. Evaluate the contribution quickly.

Output JSON:
{
  "score": 0-100,
  "issues": ["Issue 1", "Issue 2"],
  "isAcceptable": true | false
}`,
      userMessage: `Assess this ${type} contribution quality:

${content}`,
      temperature: 0.3,
      maxTokens: 500,
    });

    return parseJsonFromResponse(response.text, {
      score: 50,
      issues: ["Unable to assess"],
      isAcceptable: false,
    });
  }

  /**
   * Suggest tags for content
   */
  async suggestTags(
    content: string,
    existingTags?: string[]
  ): Promise<string[]> {
    const response = await generateCompletion({
      systemPrompt: `You are a tag suggestion system. Suggest relevant tags from this taxonomy:

AI/ML: LLMs, Machine Learning, MLOps, Computer Vision, NLP, RAG Systems, AI Agents, Prompt Engineering
Data: Data Engineering, Data Science, Analytics, ETL
Infrastructure: Cloud Architecture, AWS, GCP, Azure, Kubernetes, DevOps
Security: Security Architecture, Compliance, Identity Management
Engineering: Backend, Frontend, Full-Stack, API Design, System Design, TypeScript, Python
Product: Product Architecture, Technical Strategy
Enterprise: ERP Integration, SAP, Salesforce, Legacy Modernization

Output a JSON array of 3-6 tag strings.`,
      userMessage: `Content to tag:
${content.slice(0, 2000)}

${existingTags?.length ? `Current tags: ${existingTags.join(", ")}` : ""}

Suggest appropriate tags.`,
      temperature: 0.4,
      maxTokens: 300,
    });

    return parseJsonFromResponse(response.text, existingTags || []);
  }

  /**
   * Improve just the title and description
   */
  async improveMetadata(
    type: ContributionType,
    title: string,
    description: string,
    contentPreview: string
  ): Promise<{
    title: string;
    description: string;
  }> {
    const response = await generateCompletion({
      systemPrompt: `You improve titles and descriptions for a knowledge library.

Guidelines:
- Title: Clear, descriptive, searchable (max 60 chars)
- Description: 2-3 sentences explaining what it is and why it's useful

Output JSON:
{
  "title": "Improved title",
  "description": "Improved description"
}`,
      userMessage: `Improve the metadata for this ${type}:

Current Title: ${title}
Current Description: ${description}

Content Preview:
${contentPreview.slice(0, 1000)}`,
      temperature: 0.5,
      maxTokens: 400,
    });

    return parseJsonFromResponse(response.text, { title, description });
  }
}

// Singleton instance
let hiveContributionAgentInstance: HiveContributionAgent | null = null;

export function getHiveContributionAgent(): HiveContributionAgent {
  if (!hiveContributionAgentInstance) {
    hiveContributionAgentInstance = new HiveContributionAgent();
  }
  return hiveContributionAgentInstance;
}
