/**
 * AI Provider Router
 *
 * Routes AI requests to the appropriate provider based on AI_PROVIDER env variable.
 * Supports: gemini (default), anthropic, openai
 */

import {
  generateGeminiCompletion,
  parseJsonFromGeminiResponse,
  type GeminiCompletionOptions,
} from "./gemini";

import {
  generateAnthropicCompletion,
  parseJsonFromAnthropicResponse,
} from "./anthropic";

import {
  generateOpenAICompletion,
  parseJsonFromOpenAIResponse,
} from "./openai";

// Re-export types
export type { GeminiCompletionOptions, GeminiResponse } from "./gemini";
export type { AnthropicCompletionOptions, AnthropicResponse } from "./anthropic";
export type { OpenAICompletionOptions, OpenAIResponse } from "./openai";

export type AIProvider = "gemini" | "anthropic" | "openai";

/**
 * Get the current AI provider from environment
 */
export function getCurrentProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER?.toLowerCase() as AIProvider;
  if (provider === "anthropic" || provider === "openai") {
    return provider;
  }
  return "gemini"; // Default
}

/**
 * Get the model name for the current provider
 */
export function getModelForProvider(provider: AIProvider): string {
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_MODEL || "gemini-2.0-flash";
    case "anthropic":
      return process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022";
    case "openai":
      return process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
  }
}

/**
 * Unified completion options
 */
export interface AICompletionOptions {
  systemPrompt?: string;
  userMessage: string;
  maxTokens?: number;
  temperature?: number;
  provider?: AIProvider; // Override env-based provider
}

/**
 * Unified response type
 */
export interface AIResponse {
  text: string;
  finishReason: string;
  provider: AIProvider;
}

/**
 * Generate completion using the configured AI provider
 *
 * Automatically routes to Gemini, Anthropic, or OpenAI based on AI_PROVIDER env var
 */
export async function generateCompletion(
  options: AICompletionOptions
): Promise<AIResponse> {
  const provider = options.provider || getCurrentProvider();
  const model = getModelForProvider(provider);

  switch (provider) {
    case "gemini": {
      const response = await generateGeminiCompletion({
        model,
        systemPrompt: options.systemPrompt,
        userMessage: options.userMessage,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
      });
      return {
        text: response.text,
        finishReason: response.finishReason,
        provider: "gemini",
      };
    }

    case "anthropic": {
      const response = await generateAnthropicCompletion({
        model,
        systemPrompt: options.systemPrompt,
        userMessage: options.userMessage,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
      });
      return {
        text: response.text,
        finishReason: response.finishReason,
        provider: "anthropic",
      };
    }

    case "openai": {
      const response = await generateOpenAICompletion({
        model,
        systemPrompt: options.systemPrompt,
        userMessage: options.userMessage,
        maxTokens: options.maxTokens,
        temperature: options.temperature,
      });
      return {
        text: response.text,
        finishReason: response.finishReason,
        provider: "openai",
      };
    }

    default:
      throw new Error(`Unknown AI provider: ${provider}`);
  }
}

/**
 * Parse JSON from AI response (provider-agnostic)
 */
export function parseJsonFromResponse<T>(text: string, fallback: T): T {
  const provider = getCurrentProvider();

  switch (provider) {
    case "gemini":
      return parseJsonFromGeminiResponse(text, fallback);
    case "anthropic":
      return parseJsonFromAnthropicResponse(text, fallback);
    case "openai":
      return parseJsonFromOpenAIResponse(text, fallback);
    default:
      // Generic JSON parsing
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
        return JSON.parse(text);
      } catch {
        return fallback;
      }
  }
}

/**
 * Simple completion helper (provider-agnostic)
 */
export async function simpleCompletion(
  prompt: string,
  options?: {
    systemPrompt?: string;
    maxTokens?: number;
    temperature?: number;
    provider?: AIProvider;
  }
): Promise<string> {
  const response = await generateCompletion({
    userMessage: prompt,
    ...options,
  });
  return response.text;
}
