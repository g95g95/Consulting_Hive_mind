/**
 * Transfer Agent - Specializes in generating knowledge transfer packs
 *
 * Responsibilities:
 * - Summarize engagement outcomes
 * - Extract key decisions made
 * - Generate actionable runbooks
 * - Create internalization checklists for client autonomy
 *
 * Philosophy: The platform is SCAFFOLDING, not a toll bridge.
 * Every transfer pack should enable the client to become autonomous.
 */

import {
  generateCompletion,
  parseJsonFromResponse,
} from "../providers";

export interface TransferPackResult {
  summary: string;
  keyDecisions: string;
  runbook: string;
  nextSteps: string;
  internalizationChecklist: string;
  confidence: "high" | "medium" | "low";
}

const TRANSFER_SYSTEM_PROMPT = `You are a knowledge transfer specialist for a consulting platform called "Consulting Hive Mind".

Your mission is to create Transfer Packs - comprehensive documents that transfer knowledge from consultants to clients. The goal is to make clients AUTONOMOUS, not dependent on the platform.

## Philosophy

"The platform's deeper purpose is to transfer competence inward so clients become autonomous; the platform is SCAFFOLDING, not a toll bridge."

Every Transfer Pack should answer:
1. What did we learn together?
2. What did we decide and why?
3. How can the client do this themselves next time?
4. How will the client know they've "graduated"?

## Transfer Pack Components

### 1. Executive Summary (3-5 sentences)
- What was the original problem?
- What was accomplished?
- What's the key takeaway?

### 2. Key Decisions (bullet points)
- Each decision made during the engagement
- Include the reasoning behind each decision
- Note any alternatives that were considered and rejected

### 3. Runbook (step-by-step)
- Clear, numbered instructions the client can follow
- Include commands, configurations, or code snippets where relevant
- Each step should be self-contained and executable
- Include expected outcomes for verification

### 4. Next Steps (prioritized list)
- What should the client do after the engagement?
- Prioritize by impact and urgency
- Include rough effort estimates (quick win, medium effort, larger initiative)

### 5. Internalization Checklist
- List of competencies the client should now have
- Formatted as "I can now..." statements
- Include verification methods for each competency
- This is how the client knows they've "graduated"

## Output Format

Always respond with valid JSON:
{
  "summary": "Executive summary paragraph",
  "keyDecisions": "- Decision 1: reason\\n- Decision 2: reason\\n...",
  "runbook": "1. Step one...\\n2. Step two...\\n...",
  "nextSteps": "1. [HIGH] Next step 1\\n2. [MEDIUM] Next step 2\\n...",
  "internalizationChecklist": "- [ ] I can now...\\n- [ ] I can now...\\n...",
  "confidence": "high" | "medium" | "low"
}

## Quality Guidelines

- Be specific, not generic
- Use the client's actual context and terminology
- Include real examples from the engagement
- Make runbooks executable without external help
- Internalization checklists should be measurable`;

export class TransferAgent {
  /**
   * Generate a complete transfer pack for an engagement
   */
  async generate(engagementData: {
    engagementId?: string;
    requestTitle?: string;
    requestSummary?: string;
    desiredOutcome?: string;
    agenda?: string;
    notes?: Array<{ title?: string; content: string }>;
    messages?: Array<{ content: string; authorRole?: string }>;
  }): Promise<TransferPackResult> {
    // Format notes
    const notesText = engagementData.notes
      ?.map((n) => `${n.title || "Note"}: ${n.content}`)
      .join("\n\n") || "No notes recorded";

    // Format messages (last 30)
    const messagesText = engagementData.messages
      ?.slice(-30)
      .map((m) => `[${m.authorRole || "User"}]: ${m.content}`)
      .join("\n") || "No messages recorded";

    const response = await generateCompletion({
      systemPrompt: TRANSFER_SYSTEM_PROMPT,
      userMessage: `Generate a Transfer Pack for this engagement:

## Context
Request Title: ${engagementData.requestTitle || "Direct consultation"}
Original Summary: ${engagementData.requestSummary || "N/A"}
Desired Outcome: ${engagementData.desiredOutcome || "N/A"}

## Agenda
${engagementData.agenda || "No agenda was set"}

## Session Notes
${notesText}

## Conversation Highlights
${messagesText}

---

Please generate a comprehensive Transfer Pack that will enable the client to be autonomous going forward.`,
      temperature: 0.6,
      maxTokens: 3000,
    });

    const defaultResult: TransferPackResult = {
      summary: "Transfer pack generation incomplete. Please review manually.",
      keyDecisions: "",
      runbook: "",
      nextSteps: "",
      internalizationChecklist: "",
      confidence: "low",
    };

    return parseJsonFromResponse(response.text, defaultResult);
  }

  /**
   * Generate just the summary portion
   */
  async generateSummary(context: {
    requestTitle: string;
    notes: string[];
    messages: string[];
  }): Promise<string> {
    const response = await generateCompletion({
      systemPrompt: `You are an executive summary writer. Create a clear, concise 3-5 sentence summary of the engagement.`,
      userMessage: `Request: ${context.requestTitle}

Notes:
${context.notes.join("\n")}

Key Messages:
${context.messages.slice(-10).join("\n")}

Write an executive summary.`,
      temperature: 0.5,
      maxTokens: 500,
    });

    return response.text;
  }

  /**
   * Extract decisions from engagement content
   */
  async extractDecisions(notes: string[], messages: string[]): Promise<string[]> {
    const response = await generateCompletion({
      systemPrompt: `You are a decision extraction specialist. Identify all decisions made during a consultation.

Output a JSON array of decision strings:
["Decision 1: reason", "Decision 2: reason", ...]`,
      userMessage: `Notes:
${notes.join("\n")}

Messages:
${messages.join("\n")}

Extract all decisions made.`,
      temperature: 0.4,
      maxTokens: 1000,
    });

    return parseJsonFromResponse(response.text, []);
  }

  /**
   * Generate a runbook from decisions and outcomes
   */
  async generateRunbook(decisions: string[], desiredOutcome: string): Promise<string> {
    const response = await generateCompletion({
      systemPrompt: `You are a technical writer specializing in runbooks. Create clear, numbered step-by-step instructions.

Each step should:
- Be self-contained
- Include expected outcome
- Be executable without external help`,
      userMessage: `Decisions made:
${decisions.join("\n")}

Desired outcome: ${desiredOutcome}

Generate a runbook the client can follow.`,
      temperature: 0.5,
      maxTokens: 1500,
    });

    return response.text;
  }

  /**
   * Generate internalization checklist
   */
  async generateChecklist(
    summary: string,
    decisions: string[]
  ): Promise<string[]> {
    const response = await generateCompletion({
      systemPrompt: `You are a learning outcomes specialist. Create an internalization checklist of "I can now..." statements.

Output a JSON array:
["I can now do X", "I can now do Y", ...]`,
      userMessage: `Summary: ${summary}

Decisions: ${decisions.join("\n")}

What competencies should the client now have?`,
      temperature: 0.5,
      maxTokens: 800,
    });

    return parseJsonFromResponse(response.text, []);
  }
}

// Singleton instance
let transferAgentInstance: TransferAgent | null = null;

export function getTransferAgent(): TransferAgent {
  if (!transferAgentInstance) {
    transferAgentInstance = new TransferAgent();
  }
  return transferAgentInstance;
}
