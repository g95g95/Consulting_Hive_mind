import { generateCompletion, parseJsonFromResponse } from '../providers/gemini.js';

export interface RefinedContribution {
  title: string;
  description: string;
  content: string;
  suggestedTags: string[];
  qualityScore: number;
  improvements: string[];
}

interface ContributionInput {
  type: 'pattern' | 'prompt' | 'stack';
  title: string;
  description: string;
  content: string;
  feedback?: string;
}

const HIVE_CONTRIBUTION_SYSTEM_PROMPT = `You are a quality specialist for the Hive Library in "Consulting Hive Mind".

Refine contributions to maximize their value for other members.

## Quality Criteria:

### For Patterns
- Clear problem statement
- Step-by-step solution
- When to use / when not to use
- Example applications

### For Prompts
- Clear use case
- Well-structured prompt
- Expected output format
- Customization points marked with [VARIABLE]

### For Stack Templates
- Technology choices explained
- Architecture overview
- Setup instructions
- Pros/cons noted

## Refinement Tasks:
1. Improve clarity and structure
2. Add missing context
3. Ensure content is reusable
4. Suggest relevant tags
5. Rate quality (1-100)

## Output Format (JSON):
{
  "title": "Improved title",
  "description": "Improved description",
  "content": "Refined content",
  "suggestedTags": ["tag1", "tag2"],
  "qualityScore": 85,
  "improvements": ["What was improved 1", "What was improved 2"]
}`;

export async function refineHiveContribution(input: ContributionInput): Promise<RefinedContribution> {
  const feedbackContext = input.feedback
    ? `\n\nUser Feedback for Improvement:\n${input.feedback}`
    : '';

  const response = await generateCompletion({
    systemPrompt: HIVE_CONTRIBUTION_SYSTEM_PROMPT,
    userMessage: `Refine this ${input.type} contribution for the Hive Library:

Title: ${input.title}
Description: ${input.description}

Content:
${input.content}${feedbackContext}

Improve the quality and suggest tags.`,
    temperature: 0.6,
    maxTokens: 2500,
  });

  const defaultResult: RefinedContribution = {
    title: input.title,
    description: input.description,
    content: input.content,
    suggestedTags: [],
    qualityScore: 50,
    improvements: [],
  };

  return parseJsonFromResponse(response.text, defaultResult);
}
