import Anthropic from "@anthropic-ai/sdk";

let anthropicClient: Anthropic | null = null;

function getAnthropicClient() {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is required");
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

export interface AnthropicCompletionOptions {
  model?: string;
  systemPrompt?: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AnthropicResponse {
  text: string;
  finishReason: string;
}

/**
 * Generate completion using Anthropic Claude
 */
export async function generateAnthropicCompletion(
  options: AnthropicCompletionOptions
): Promise<AnthropicResponse> {
  const {
    model = "claude-3-5-sonnet-20241022",
    systemPrompt,
    userMessage,
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model,
      max_tokens: maxTokens,
      system: systemPrompt || "",
      messages: [
        {
          role: "user",
          content: userMessage,
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const text = textBlock && "text" in textBlock ? textBlock.text : "";

    return {
      text,
      finishReason: response.stop_reason || "end_turn",
    };
  } catch (error) {
    console.error("Anthropic API error:", error);
    throw error;
  }
}

/**
 * Simple completion helper
 */
export async function simpleAnthropicCompletion(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const response = await generateAnthropicCompletion({
    userMessage: prompt,
    ...options,
  });
  return response.text;
}

/**
 * Parse JSON from Anthropic response
 */
export function parseJsonFromAnthropicResponse<T>(text: string, fallback: T): T {
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
