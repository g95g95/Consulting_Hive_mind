import OpenAI from "openai";

let openaiClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is required");
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

export interface OpenAICompletionOptions {
  model?: string;
  systemPrompt?: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export interface OpenAIResponse {
  text: string;
  finishReason: string;
}

/**
 * Generate completion using OpenAI GPT
 */
export async function generateOpenAICompletion(
  options: OpenAICompletionOptions
): Promise<OpenAIResponse> {
  const {
    model = "gpt-4-turbo-preview",
    systemPrompt,
    userMessage,
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  const client = getOpenAIClient();

  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];

    if (systemPrompt) {
      messages.push({
        role: "system",
        content: systemPrompt,
      });
    }

    messages.push({
      role: "user",
      content: userMessage,
    });

    const response = await client.chat.completions.create({
      model,
      max_tokens: maxTokens,
      temperature,
      messages,
    });

    return {
      text: response.choices[0]?.message?.content || "",
      finishReason: response.choices[0]?.finish_reason || "stop",
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw error;
  }
}

/**
 * Simple completion helper
 */
export async function simpleOpenAICompletion(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const response = await generateOpenAICompletion({
    userMessage: prompt,
    ...options,
  });
  return response.text;
}

/**
 * Parse JSON from OpenAI response
 */
export function parseJsonFromOpenAIResponse<T>(text: string, fallback: T): T {
  try {
    // Try to extract JSON from markdown code blocks
    const jsonBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonBlockMatch) {
      return JSON.parse(jsonBlockMatch[1].trim());
    }

    // Try to find raw JSON object
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    // Try to parse the entire response as JSON
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}
