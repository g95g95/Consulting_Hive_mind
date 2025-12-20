import { GoogleGenerativeAI } from "@google/generative-ai";
import type { Tool, ToolResult } from "../tools/registry";

let genAI: GoogleGenerativeAI | null = null;

function getGeminiClient() {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY or GOOGLE_AI_API_KEY is required");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

export interface GeminiCompletionOptions {
  model?: string;
  systemPrompt?: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  tools?: Tool[];
  toolHandlers?: Record<string, (args: Record<string, unknown>) => Promise<ToolResult>>;
}

export interface GeminiResponse {
  text: string;
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    result?: ToolResult;
  }>;
  finishReason: string;
}

/**
 * Generate completion using Gemini
 * Note: Function calling is simplified for MVP - tools are processed via prompting
 */
export async function generateGeminiCompletion(
  options: GeminiCompletionOptions
): Promise<GeminiResponse> {
  const {
    model = "gemini-1.5-pro",
    systemPrompt,
    userMessage,
    maxTokens = 2000,
    temperature = 0.7,
  } = options;

  const client = getGeminiClient();

  const generativeModel = client.getGenerativeModel({
    model,
    generationConfig: {
      maxOutputTokens: maxTokens,
      temperature,
    },
  });

  // Build the prompt with system instruction if provided
  const fullPrompt = systemPrompt
    ? `${systemPrompt}\n\n---\n\nUser: ${userMessage}`
    : userMessage;

  try {
    const result = await generativeModel.generateContent(fullPrompt);
    const response = result.response;

    return {
      text: response.text(),
      finishReason: response.candidates?.[0]?.finishReason || "STOP",
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw error;
  }
}

/**
 * Simple completion without tools (for basic use cases)
 */
export async function simpleGeminiCompletion(
  prompt: string,
  options?: {
    model?: string;
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
  }
): Promise<string> {
  const response = await generateGeminiCompletion({
    userMessage: prompt,
    ...options,
  });
  return response.text;
}

/**
 * Parse JSON from Gemini response (handles markdown code blocks)
 */
export function parseJsonFromGeminiResponse<T>(text: string, fallback: T): T {
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
