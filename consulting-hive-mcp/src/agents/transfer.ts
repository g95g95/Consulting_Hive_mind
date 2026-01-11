import { generateCompletion, parseJsonFromResponse } from '../providers/gemini.js';

export interface TransferPackContent {
  summary: string;
  keyDecisions: string;
  runbook: string;
  nextSteps: string;
  internalizationChecklist: string;
}

interface EngagementData {
  request: {
    title: string;
    rawDescription: string;
    refinedSummary?: string | null;
  } | null;
  messages: Array<{ content: string; isSystem: boolean }>;
  notes: Array<{ title?: string | null; content: string }>;
  checklistItems: Array<{ text: string; isCompleted: boolean }>;
}

const TRANSFER_SYSTEM_PROMPT = `You are a knowledge transfer specialist for "Consulting Hive Mind".

Generate comprehensive transfer packs that capture all value from consulting engagements, enabling clients to continue independently.

## Transfer Pack Sections:

1. **Summary** (2-3 paragraphs)
   - What was the original problem?
   - What approach was taken?
   - What was the outcome?

2. **Key Decisions** (bullet points)
   - Important choices made and their rationale
   - Trade-offs considered
   - Why alternatives were rejected

3. **Runbook** (step-by-step)
   - Actionable procedures the client can follow
   - Commands, configurations, or workflows
   - Troubleshooting tips

4. **Next Steps** (prioritized list)
   - What should the client do next?
   - Short-term vs long-term actions
   - Dependencies between steps

5. **Internalization Checklist**
   - Questions to verify understanding
   - Skills to develop
   - Resources for further learning

## Output Format (JSON):
{
  "summary": "Multi-paragraph summary",
  "keyDecisions": "- Decision 1: rationale\\n- Decision 2: rationale",
  "runbook": "## Step 1\\n...\\n## Step 2\\n...",
  "nextSteps": "1. Immediate: ...\\n2. Short-term: ...\\n3. Long-term: ...",
  "internalizationChecklist": "- [ ] Can explain X\\n- [ ] Can do Y\\n- [ ] Knows where to find Z"
}`;

export async function generateTransferPack(data: EngagementData): Promise<TransferPackContent> {
  const messagesContext = data.messages
    .filter(m => !m.isSystem)
    .slice(-50)
    .map(m => m.content)
    .join('\n---\n');

  const notesContext = data.notes
    .map(n => `${n.title ? `## ${n.title}\n` : ''}${n.content}`)
    .join('\n\n');

  const checklistContext = data.checklistItems
    .map(c => `- [${c.isCompleted ? 'x' : ' '}] ${c.text}`)
    .join('\n');

  const response = await generateCompletion({
    systemPrompt: TRANSFER_SYSTEM_PROMPT,
    userMessage: `Generate a knowledge transfer pack for this engagement:

## Original Request
Title: ${data.request?.title || 'Unknown'}
Description: ${data.request?.refinedSummary || data.request?.rawDescription || 'Not available'}

## Conversation Highlights
${messagesContext || 'No messages recorded'}

## Consultant Notes
${notesContext || 'No notes recorded'}

## Checklist Status
${checklistContext || 'No checklist items'}

Create a comprehensive transfer pack that captures all the value from this engagement.`,
    temperature: 0.5,
    maxTokens: 3000,
  });

  const defaultResult: TransferPackContent = {
    summary: 'Transfer pack generation failed. Please complete manually.',
    keyDecisions: '',
    runbook: '',
    nextSteps: '',
    internalizationChecklist: '',
  };

  return parseJsonFromResponse(response.text, defaultResult);
}
