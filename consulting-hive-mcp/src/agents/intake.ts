import { generateCompletion, parseJsonFromResponse } from '../providers/gemini.js';

export interface IntakeResult {
  summary: string;
  constraints?: string;
  desiredOutcome?: string;
  suggestedDuration?: number;
  suggestedSkills: string[];
  sensitiveDataWarning: boolean;
  clarifyingQuestions?: string[];
}

const INTAKE_SYSTEM_PROMPT = `You are an expert consultant intake specialist for "Consulting Hive Mind".

Transform messy, unstructured problem descriptions into clear, actionable consultation scopes.

## Process:
1. Extract the Core Problem - what is the client actually trying to solve?
2. Identify Constraints - technical, budget, timeline, team constraints
3. Define Success - what tangible outcome do they expect?
4. Estimate Duration - 30min (quick), 60min (standard), 90min (complex)
5. Suggest Skills from: AI/ML, Data, Infrastructure, Security, Engineering, Product, Enterprise
6. Flag Sensitive Data - set sensitiveDataWarning=true if PII, credentials, or proprietary info mentioned

## Output Format (JSON):
{
  "summary": "Clear 2-3 sentence summary",
  "constraints": "Identified constraints",
  "desiredOutcome": "What success looks like",
  "suggestedDuration": 30 | 60 | 90,
  "suggestedSkills": ["Skill1", "Skill2"],
  "sensitiveDataWarning": true | false,
  "clarifyingQuestions": ["Question?"] // optional
}`;

export async function refineRequest(
  rawDescription: string,
  constraints?: string
): Promise<IntakeResult> {
  const message = constraints
    ? `Please refine this consultation request:\n\n${rawDescription}\n\nConstraints: ${constraints}`
    : `Please refine this consultation request:\n\n${rawDescription}`;

  const response = await generateCompletion({
    systemPrompt: INTAKE_SYSTEM_PROMPT,
    userMessage: message,
    temperature: 0.5,
    maxTokens: 1500,
  });

  const defaultResult: IntakeResult = {
    summary: rawDescription.slice(0, 200),
    suggestedSkills: [],
    sensitiveDataWarning: false,
  };

  return parseJsonFromResponse(response.text, defaultResult);
}
