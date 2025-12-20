/**
 * Intake Agent - Specializes in refining consultation requests
 *
 * Responsibilities:
 * - Transform messy problem descriptions into structured scopes
 * - Classify domains and suggest relevant skills
 * - Detect potentially sensitive data
 * - Suggest appropriate consultation duration
 */

import {
  generateCompletion,
  parseJsonFromResponse,
  getCurrentProvider,
  getModelForProvider,
} from "../providers";

export interface IntakeResult {
  summary: string;
  constraints: string;
  desiredOutcome: string;
  suggestedDuration: 30 | 60 | 90;
  suggestedSkills: string[];
  sensitiveDataWarning: boolean;
  clarifyingQuestions?: string[];
  confidence: "high" | "medium" | "low";
}

const INTAKE_SYSTEM_PROMPT = `You are an expert consultant intake specialist for a consulting platform called "Consulting Hive Mind".

Your primary goal is to transform messy, unstructured problem descriptions into clear, actionable consultation scopes. You are the first point of contact for clients who may not know exactly what they need.

## Your Process:

1. **Extract the Core Problem**
   - What is the client actually trying to solve?
   - What's the business impact if this isn't solved?

2. **Identify Constraints**
   - Technical constraints (existing systems, technologies, etc.)
   - Budget constraints (if mentioned)
   - Timeline constraints (urgency, deadlines)
   - Team/resource constraints

3. **Define Success**
   - What does the client want to achieve?
   - How will they know the consultation was successful?
   - What tangible outcome do they expect?

4. **Estimate Duration**
   - 30 minutes: Quick questions, specific technical advice, code review
   - 60 minutes: Standard consultation, architecture review, problem-solving
   - 90 minutes: Complex problems, strategic planning, deep dives

5. **Suggest Skills**
   Only suggest from this taxonomy:
   - AI/ML: LLMs, Machine Learning, MLOps, Computer Vision, NLP, RAG Systems, AI Agents, Prompt Engineering
   - Data: Data Engineering, Data Science, Analytics, Data Visualization, ETL/ELT
   - Infrastructure: Cloud Architecture, AWS, GCP, Azure, Kubernetes, DevOps, Platform Engineering
   - Security: Security Architecture, Penetration Testing, Compliance, Identity Management
   - Engineering: Backend Development, Frontend Development, Full-Stack Development, API Design, System Design, Code Review
   - Product: Product Architecture, Technical Strategy, Technical Due Diligence, Roadmap Planning
   - Enterprise: ERP Integration, SAP, Salesforce, Legacy Modernization

6. **Flag Sensitive Data**
   Set sensitiveDataWarning=true if the description mentions:
   - Personal data (names, emails, health records)
   - Financial data (account numbers, transactions)
   - Credentials (API keys, passwords)
   - Proprietary information

7. **Generate Clarifying Questions** (optional)
   If the description is too vague, suggest 2-3 clarifying questions.

## Output Format

Always respond with valid JSON:
{
  "summary": "Clear 2-3 sentence summary of the need",
  "constraints": "Identified constraints as a bullet list or paragraph",
  "desiredOutcome": "What success looks like",
  "suggestedDuration": 30 | 60 | 90,
  "suggestedSkills": ["Skill1", "Skill2"],
  "sensitiveDataWarning": true | false,
  "clarifyingQuestions": ["Question 1?", "Question 2?"] // optional
  "confidence": "high" | "medium" | "low"
}`;

export class IntakeAgent {
  /**
   * Refine a raw consultation request
   */
  async refine(rawDescription: string): Promise<IntakeResult> {
    const response = await generateCompletion({
      systemPrompt: INTAKE_SYSTEM_PROMPT,
      userMessage: `Please refine this consultation request:\n\n${rawDescription}`,
      temperature: 0.5,
      maxTokens: 1500,
    });

    const defaultResult: IntakeResult = {
      summary: rawDescription.slice(0, 200),
      constraints: "",
      desiredOutcome: "",
      suggestedDuration: 60,
      suggestedSkills: [],
      sensitiveDataWarning: false,
      confidence: "low",
    };

    return parseJsonFromResponse(response.text, defaultResult);
  }

  /**
   * Classify domain and suggest skills for an already-refined request
   */
  async classifyDomain(summary: string): Promise<{
    primaryDomain: string;
    secondaryDomains: string[];
    suggestedSkills: string[];
  }> {
    const response = await generateCompletion({
      systemPrompt: `You are a domain classification expert. Classify the given summary into relevant domains and suggest skills.

Output JSON:
{
  "primaryDomain": "The main domain (AI/ML, Data, Infrastructure, Security, Engineering, Product, Enterprise)",
  "secondaryDomains": ["Other relevant domains"],
  "suggestedSkills": ["Specific skills from the taxonomy"]
}`,
      userMessage: summary,
      temperature: 0.3,
      maxTokens: 500,
    });

    return parseJsonFromResponse(response.text, {
      primaryDomain: "Engineering",
      secondaryDomains: [],
      suggestedSkills: [],
    });
  }

  /**
   * Detect sensitive data in content
   */
  async detectSensitiveData(content: string): Promise<{
    hasSensitiveData: boolean;
    types: string[];
    locations: string[];
    recommendation: string;
  }> {
    const response = await generateCompletion({
      systemPrompt: `You are a privacy and security analyst. Scan content for sensitive data.

Output JSON:
{
  "hasSensitiveData": true | false,
  "types": ["email", "phone", "api_key", etc.],
  "locations": ["Brief description of where in the text"],
  "recommendation": "What the user should do"
}`,
      userMessage: content,
      temperature: 0.2,
      maxTokens: 500,
    });

    return parseJsonFromResponse(response.text, {
      hasSensitiveData: false,
      types: [],
      locations: [],
      recommendation: "No sensitive data detected.",
    });
  }
}

// Singleton instance
let intakeAgentInstance: IntakeAgent | null = null;

export function getIntakeAgent(): IntakeAgent {
  if (!intakeAgentInstance) {
    intakeAgentInstance = new IntakeAgent();
  }
  return intakeAgentInstance;
}
