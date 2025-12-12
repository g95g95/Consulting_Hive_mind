import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

type AIProvider = "anthropic" | "openai";

const provider = (process.env.AI_PROVIDER as AIProvider) || "anthropic";

let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

function getAnthropic() {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
}

function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AICompletionOptions {
  system?: string;
  messages: AIMessage[];
  maxTokens?: number;
  temperature?: number;
}

export async function generateCompletion(options: AICompletionOptions): Promise<string> {
  const { system, messages, maxTokens = 2000, temperature = 0.7 } = options;

  if (provider === "anthropic") {
    const client = getAnthropic();
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: maxTokens,
      system: system || "",
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const textBlock = response.content.find((block) => block.type === "text");
    return textBlock ? textBlock.text : "";
  } else {
    const client = getOpenAI();
    const formattedMessages = system
      ? [{ role: "system" as const, content: system }, ...messages]
      : messages;

    const response = await client.chat.completions.create({
      model: "gpt-4-turbo-preview",
      max_tokens: maxTokens,
      temperature,
      messages: formattedMessages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      })),
    });

    return response.choices[0]?.message?.content || "";
  }
}

// Specific AI functions

export async function refineRequest(rawDescription: string): Promise<{
  summary: string;
  constraints: string;
  desiredOutcome: string;
  suggestedDuration: number;
  suggestedSkills: string[];
  sensitiveDataWarning: boolean;
}> {
  const system = `You are an expert consultant intake specialist. Your job is to take messy, unstructured problem descriptions and extract a clear, structured scope.

Output a JSON object with these fields:
- summary: A clear 2-3 sentence summary of what the client needs
- constraints: Any technical, budget, or time constraints mentioned
- desiredOutcome: What success looks like for this engagement
- suggestedDuration: Suggested consultation duration in minutes (30, 60, or 90)
- suggestedSkills: Array of relevant skill tags from this list: LLMs, Machine Learning, MLOps, RAG Systems, AI Agents, Prompt Engineering, Data Engineering, Data Science, Analytics, Cloud Architecture, AWS, GCP, Azure, Kubernetes, DevOps, Security Architecture, Backend Development, Frontend Development, Full-Stack Development, API Design, System Design, Product Architecture, Technical Strategy, ERP Integration, Legacy Modernization
- sensitiveDataWarning: Boolean - true if the description mentions potentially sensitive data (PII, health data, financial data, credentials, etc.)

Be helpful and extract as much structure as possible. If information is missing, make reasonable assumptions for an initial scope.`;

  const response = await generateCompletion({
    system,
    messages: [
      {
        role: "user",
        content: `Please refine this consultation request:\n\n${rawDescription}`,
      },
    ],
    maxTokens: 1500,
    temperature: 0.5,
  });

  try {
    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found in response");
  } catch {
    // Return defaults if parsing fails
    return {
      summary: rawDescription.slice(0, 200),
      constraints: "",
      desiredOutcome: "",
      suggestedDuration: 60,
      suggestedSkills: [],
      sensitiveDataWarning: false,
    };
  }
}

export async function generateMatchExplanation(
  request: { title: string; refinedSummary: string; desiredOutcome: string },
  consultant: { headline: string; bio: string; skills: string[] }
): Promise<{ score: number; reason: string }> {
  const system = `You are a matching expert. Evaluate how well a consultant matches a client's request.
Output JSON with:
- score: 0-100 match score
- reason: 2-3 sentence explanation of why this is a good/bad match`;

  const response = await generateCompletion({
    system,
    messages: [
      {
        role: "user",
        content: `Request: ${request.title}
Summary: ${request.refinedSummary}
Desired Outcome: ${request.desiredOutcome}

Consultant: ${consultant.headline}
Bio: ${consultant.bio}
Skills: ${consultant.skills.join(", ")}`,
      },
    ],
    maxTokens: 500,
    temperature: 0.5,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found");
  } catch {
    return { score: 50, reason: "Unable to calculate match score." };
  }
}

export async function generateTransferPack(engagement: {
  agenda: string | null;
  notes: { content: string; title: string | null }[];
  messages: { content: string; authorId: string }[];
  request?: { title: string; refinedSummary: string | null; desiredOutcome: string | null } | null;
}): Promise<{
  summary: string;
  keyDecisions: string;
  runbook: string;
  nextSteps: string;
  internalizationChecklist: string;
}> {
  const system = `You are creating a Transfer Pack - a knowledge transfer document to help the client internalize what they learned from a consultation. The goal is to make the client autonomous, not dependent.

Output JSON with:
- summary: Executive summary of the engagement (3-5 sentences)
- keyDecisions: Bullet points of key decisions made
- runbook: Step-by-step instructions the client can follow
- nextSteps: Recommended next actions
- internalizationChecklist: A checklist of things the client should now be able to do themselves`;

  const notesText = engagement.notes
    .map((n) => `${n.title || "Note"}: ${n.content}`)
    .join("\n");
  const messagesText = engagement.messages
    .slice(-20)
    .map((m) => m.content)
    .join("\n");

  const response = await generateCompletion({
    system,
    messages: [
      {
        role: "user",
        content: `Generate a Transfer Pack for this engagement:

Request: ${engagement.request?.title || "Direct consultation"}
Summary: ${engagement.request?.refinedSummary || "N/A"}
Desired Outcome: ${engagement.request?.desiredOutcome || "N/A"}

Agenda: ${engagement.agenda || "No agenda set"}

Notes:
${notesText || "No notes"}

Recent Messages:
${messagesText || "No messages"}`,
      },
    ],
    maxTokens: 2000,
    temperature: 0.6,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found");
  } catch {
    return {
      summary: "Transfer pack generation failed. Please fill in manually.",
      keyDecisions: "",
      runbook: "",
      nextSteps: "",
      internalizationChecklist: "",
    };
  }
}

export async function redactSensitiveContent(
  content: string
): Promise<{ redactedText: string; detectedPII: string[]; detectedSecrets: string[] }> {
  const system = `You are a privacy and security expert. Your job is to redact sensitive information from text before it can be shared publicly.

Redact:
- Personal names (replace with [NAME])
- Company names (replace with [COMPANY])
- Email addresses (replace with [EMAIL])
- Phone numbers (replace with [PHONE])
- Addresses (replace with [ADDRESS])
- API keys, passwords, tokens (replace with [REDACTED_SECRET])
- Financial data like account numbers (replace with [FINANCIAL])
- Health information (replace with [HEALTH_INFO])

Output JSON with:
- redactedText: The text with sensitive info replaced
- detectedPII: Array of types of PII detected (e.g., ["names", "emails"])
- detectedSecrets: Array of types of secrets detected (e.g., ["api_keys"])`;

  const response = await generateCompletion({
    system,
    messages: [
      {
        role: "user",
        content: `Please redact sensitive information from this text:\n\n${content}`,
      },
    ],
    maxTokens: content.length + 500,
    temperature: 0.3,
  });

  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No JSON found");
  } catch {
    return {
      redactedText: content,
      detectedPII: [],
      detectedSecrets: [],
    };
  }
}
