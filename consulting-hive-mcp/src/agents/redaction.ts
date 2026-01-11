import { generateCompletion, parseJsonFromResponse } from '../providers/gemini.js';

export interface RedactionResult {
  redactedText: string;
  detectedPII: string[];
  detectedSecrets: string[];
  confidence: 'high' | 'medium' | 'low';
  requiresManualReview: boolean;
}

const REDACTION_SYSTEM_PROMPT = `You are a privacy and security specialist for "Consulting Hive Mind".

Detect and redact sensitive information before content is shared publicly.

## Security Principle: "When in doubt, REDACT."

## What to Redact:

### PII
- Names → [NAME]
- Emails → [EMAIL]
- Phones → [PHONE]
- Addresses → [ADDRESS]
- IDs (SSN, etc.) → [ID]
- Financial (CC, bank) → [FINANCIAL]

### Company Info
- Company Names → [COMPANY]
- Internal URLs/systems → [INTERNAL]

### Secrets
- API Keys → [REDACTED_API_KEY]
- Passwords → [REDACTED_PASSWORD]
- Tokens → [REDACTED_TOKEN]
- Connection strings → [REDACTED_SECRET]

## Output Format (JSON):
{
  "redactedText": "Content with all sensitive info replaced",
  "detectedPII": ["names", "emails"],
  "detectedSecrets": ["api_keys"],
  "confidence": "high" | "medium" | "low",
  "requiresManualReview": true | false
}`;

function regexRedact(content: string): {
  partialRedacted: string;
  detectedPII: string[];
  detectedSecrets: string[];
} {
  let redacted = content;
  const detectedPII: string[] = [];
  const detectedSecrets: string[] = [];

  // Email
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  if (emailRegex.test(content)) {
    detectedPII.push('emails');
    redacted = redacted.replace(emailRegex, '[EMAIL]');
  }

  // Phone numbers
  const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
  if (phoneRegex.test(content)) {
    detectedPII.push('phones');
    redacted = redacted.replace(phoneRegex, '[PHONE]');
  }

  // SSN
  const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
  if (ssnRegex.test(content)) {
    detectedPII.push('ssn');
    redacted = redacted.replace(ssnRegex, '[SSN]');
  }

  // OpenAI API keys
  const openaiRegex = /sk-[a-zA-Z0-9]{48,}/g;
  if (openaiRegex.test(content)) {
    detectedSecrets.push('openai_api_key');
    redacted = redacted.replace(openaiRegex, '[REDACTED_OPENAI_KEY]');
  }

  // AWS access keys
  const awsRegex = /AKIA[0-9A-Z]{16}/g;
  if (awsRegex.test(content)) {
    detectedSecrets.push('aws_access_key');
    redacted = redacted.replace(awsRegex, '[REDACTED_AWS_KEY]');
  }

  // Generic API keys
  const apiKeyRegex = /(api[_-]?key|apikey|api_secret)[=:\s]["']?[a-zA-Z0-9]{20,}["']?/gi;
  if (apiKeyRegex.test(content)) {
    detectedSecrets.push('api_key');
    redacted = redacted.replace(apiKeyRegex, '[REDACTED_API_KEY]');
  }

  // Passwords
  const passwordRegex = /(password|passwd|pwd)[=:\s]["']?[^\s"'&]{4,}["']?/gi;
  if (passwordRegex.test(content)) {
    detectedSecrets.push('password');
    redacted = redacted.replace(passwordRegex, 'password=[REDACTED_PASSWORD]');
  }

  // Bearer tokens
  const bearerRegex = /Bearer\s+[a-zA-Z0-9._-]+/g;
  if (bearerRegex.test(content)) {
    detectedSecrets.push('bearer_token');
    redacted = redacted.replace(bearerRegex, 'Bearer [REDACTED_TOKEN]');
  }

  // Connection strings
  const connStringRegex = /(mongodb|postgres|mysql|redis):\/\/[^\s]+/gi;
  if (connStringRegex.test(content)) {
    detectedSecrets.push('connection_string');
    redacted = redacted.replace(connStringRegex, '[REDACTED_CONNECTION_STRING]');
  }

  return { partialRedacted: redacted, detectedPII, detectedSecrets };
}

export async function redactContent(content: string): Promise<RedactionResult> {
  const regexResult = regexRedact(content);

  const response = await generateCompletion({
    systemPrompt: REDACTION_SYSTEM_PROMPT,
    userMessage: `Please redact sensitive information from this content:

---
${regexResult.partialRedacted}
---

Already detected:
- PII: ${regexResult.detectedPII.join(', ') || 'none'}
- Secrets: ${regexResult.detectedSecrets.join(', ') || 'none'}

Complete the redaction for names, companies, and contextual sensitive info.`,
    temperature: 0.3,
    maxTokens: Math.max(2000, content.length + 500),
  });

  const defaultResult: RedactionResult = {
    redactedText: regexResult.partialRedacted,
    detectedPII: regexResult.detectedPII,
    detectedSecrets: regexResult.detectedSecrets,
    confidence: 'low',
    requiresManualReview: true,
  };

  const aiResult = parseJsonFromResponse(response.text, defaultResult);

  return {
    redactedText: aiResult.redactedText,
    detectedPII: [...new Set([...regexResult.detectedPII, ...aiResult.detectedPII])],
    detectedSecrets: [...new Set([...regexResult.detectedSecrets, ...aiResult.detectedSecrets])],
    confidence: aiResult.confidence,
    requiresManualReview: aiResult.requiresManualReview,
  };
}
