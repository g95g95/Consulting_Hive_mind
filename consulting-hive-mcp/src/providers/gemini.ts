import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI: GoogleGenerativeAI | null = null;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractRetryDelay(error: unknown): number {
  if (error instanceof Error) {
    const match = error.message.match(/retry in (\d+(?:\.\d+)?)/i);
    if (match) {
      return Math.ceil(parseFloat(match[1]) * 1000);
    }
  }
  return 10000;
}

function getClient(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is required');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface CompletionOptions {
  model?: string;
  systemPrompt?: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CompletionResponse {
  text: string;
  finishReason: string;
}

export async function generateCompletion(options: CompletionOptions): Promise<CompletionResponse> {
  const {
    model = process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    systemPrompt,
    userMessage,
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  const client = getClient();

  const generativeModel = client.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  });

  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n---\n\nUser: ${userMessage}`
    : userMessage;

  const maxRetries = 3;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generativeModel.generateContent(fullPrompt);
      const response = result.response;

      return {
        text: response.text(),
        finishReason: response.candidates?.[0]?.finishReason || 'STOP',
      };
    } catch (error) {
      lastError = error;

      const isRateLimited = error instanceof Error &&
        (error.message.includes('429') ||
         error.message.includes('quota') ||
         error.message.includes('rate'));

      if (isRateLimited && attempt < maxRetries) {
        const retryDelay = extractRetryDelay(error);
        console.warn(`Gemini rate limited. Retrying in ${retryDelay}ms (attempt ${attempt}/${maxRetries})`);
        await sleep(retryDelay);
        continue;
      }

      throw error;
    }
  }

  throw lastError;
}

export function parseJsonFromResponse<T>(text: string, fallback: T): T {
  try {
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      return JSON.parse(jsonBlockMatch[1].trim());
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
