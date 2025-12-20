/**
 * Redaction Agent - Specializes in PII/secrets detection and redaction
 *
 * Responsibilities:
 * - Detect personally identifiable information (PII)
 * - Detect secrets (API keys, passwords, tokens)
 * - Redact sensitive content before public sharing
 * - Ensure hive library contributions are safe
 *
 * Security Principle: When in doubt, redact.
 * False positives are better than leaking sensitive data.
 */

import {
  generateCompletion,
  parseJsonFromResponse,
} from "../providers";

export interface RedactionResult {
  redactedText: string;
  detectedPII: string[];
  detectedSecrets: string[];
  confidence: "high" | "medium" | "low";
  requiresManualReview: boolean;
  changes: Array<{
    type: string;
    original: string;
    replacement: string;
  }>;
}

const REDACTION_SYSTEM_PROMPT = `You are a privacy and security specialist for a consulting platform called "Consulting Hive Mind".

Your mission is to detect and redact sensitive information before content is shared publicly in the hive library. You are the last line of defense against data leaks.

## Security Principle

"When in doubt, REDACT."

False positives are far better than leaking sensitive data. If something looks like it might be sensitive, redact it.

## What to Redact

### PII (Personally Identifiable Information)
- **Names** → [NAME]
  - Personal names (John Smith, Jane Doe)
  - Usernames that could identify someone
- **Contact Info** → [EMAIL], [PHONE], [ADDRESS]
  - Email addresses
  - Phone numbers (any format)
  - Physical addresses
- **IDs** → [ID]
  - Social Security Numbers
  - Driver's license numbers
  - Passport numbers
  - Employee IDs
- **Financial** → [FINANCIAL]
  - Credit card numbers
  - Bank account numbers
  - Routing numbers
- **Health** → [HEALTH_INFO]
  - Medical conditions
  - Medications
  - Health records

### Company Information
- **Company Names** → [COMPANY]
  - Organization names
  - Product names that identify a company
  - Project codenames
- **Internal Info** → [INTERNAL]
  - Internal URLs
  - Intranet links
  - Internal system names

### Secrets
- **API Keys** → [REDACTED_API_KEY]
  - OpenAI keys (sk-...)
  - AWS keys (AKIA...)
  - Any key= or apiKey= patterns
- **Passwords** → [REDACTED_PASSWORD]
  - password=, pwd=, pass=
  - Connection strings with passwords
- **Tokens** → [REDACTED_TOKEN]
  - Bearer tokens
  - JWT tokens
  - OAuth tokens
- **Other Secrets** → [REDACTED_SECRET]
  - Private keys
  - Certificates
  - Encryption keys

## Output Format

Always respond with valid JSON:
{
  "redactedText": "The content with all sensitive info replaced",
  "detectedPII": ["names", "emails", "phones"],
  "detectedSecrets": ["api_keys", "passwords"],
  "confidence": "high" | "medium" | "low",
  "requiresManualReview": true | false,
  "changes": [
    {
      "type": "email",
      "original": "john@example.com",
      "replacement": "[EMAIL]"
    }
  ]
}

## Confidence Levels

- **high**: All patterns are clear and unambiguous
- **medium**: Some patterns required interpretation (e.g., could be a name or a product)
- **low**: Many ambiguous patterns, definitely needs human review

## Manual Review Triggers

Set requiresManualReview=true if:
- Confidence is medium or low
- Names needed contextual interpretation
- Company/product names were ambiguous
- Content contains code with potential secrets
- Any uncertainty about what should be redacted`;

export class RedactionAgent {
  /**
   * Perform full redaction on content
   */
  async redact(
    content: string,
    contentType?: "pattern" | "prompt" | "stack_template" | "general"
  ): Promise<RedactionResult> {
    // First pass: regex-based detection (fast, deterministic)
    const regexResult = this.regexRedact(content);

    // Use AI for semantic analysis
    const response = await generateCompletion({
      systemPrompt: REDACTION_SYSTEM_PROMPT,
      userMessage: `Please redact sensitive information from this ${contentType || "content"}:

---
${regexResult.partialRedacted}
---

Note: Some patterns have already been detected:
- PII found: ${regexResult.detectedPII.join(", ") || "none"}
- Secrets found: ${regexResult.detectedSecrets.join(", ") || "none"}

Please complete the redaction, especially for:
1. Names that might have been missed
2. Company names
3. Any contextual sensitive information

Return the fully redacted version.`,
      temperature: 0.3, // Low temperature for conservative redaction
      maxTokens: Math.max(2000, content.length + 500),
    });

    const defaultResult: RedactionResult = {
      redactedText: regexResult.partialRedacted,
      detectedPII: regexResult.detectedPII,
      detectedSecrets: regexResult.detectedSecrets,
      confidence: "low",
      requiresManualReview: true,
      changes: regexResult.changes,
    };

    const aiResult = parseJsonFromResponse(response.text, defaultResult);

    // Merge regex and AI results
    return {
      redactedText: aiResult.redactedText,
      detectedPII: [...new Set([...regexResult.detectedPII, ...aiResult.detectedPII])],
      detectedSecrets: [...new Set([...regexResult.detectedSecrets, ...aiResult.detectedSecrets])],
      confidence: aiResult.confidence,
      requiresManualReview: aiResult.requiresManualReview,
      changes: [...regexResult.changes, ...(aiResult.changes || [])],
    };
  }

  /**
   * Quick check if content contains sensitive data (without redacting)
   */
  async detectSensitiveData(content: string): Promise<{
    hasSensitiveData: boolean;
    types: string[];
    severity: "high" | "medium" | "low";
    recommendation: string;
  }> {
    const regexResult = this.regexRedact(content);

    if (
      regexResult.detectedPII.length > 0 ||
      regexResult.detectedSecrets.length > 0
    ) {
      const hasSecrets = regexResult.detectedSecrets.length > 0;
      return {
        hasSensitiveData: true,
        types: [...regexResult.detectedPII, ...regexResult.detectedSecrets],
        severity: hasSecrets ? "high" : "medium",
        recommendation: hasSecrets
          ? "Content contains secrets. Must be redacted before sharing."
          : "Content contains PII. Recommend redaction before sharing.",
      };
    }

    // Use AI for semantic detection
    const response = await generateCompletion({
      systemPrompt: `You are a sensitive data detector. Analyze content for potential PII or secrets.

Output JSON:
{
  "hasSensitiveData": true | false,
  "types": ["names", "companies", etc.],
  "severity": "high" | "medium" | "low",
  "recommendation": "What should be done"
}`,
      userMessage: content,
      temperature: 0.2,
      maxTokens: 500,
    });

    return parseJsonFromResponse(response.text, {
      hasSensitiveData: false,
      types: [],
      severity: "low" as const,
      recommendation: "No obvious sensitive data detected.",
    });
  }

  /**
   * Regex-based redaction (first pass)
   */
  private regexRedact(content: string): {
    partialRedacted: string;
    detectedPII: string[];
    detectedSecrets: string[];
    changes: Array<{ type: string; original: string; replacement: string }>;
  } {
    let redacted = content;
    const detectedPII: string[] = [];
    const detectedSecrets: string[] = [];
    const changes: Array<{ type: string; original: string; replacement: string }> = [];

    // Email
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = content.match(emailRegex);
    if (emails) {
      detectedPII.push("emails");
      emails.forEach((email) => {
        changes.push({ type: "email", original: email, replacement: "[EMAIL]" });
      });
      redacted = redacted.replace(emailRegex, "[EMAIL]");
    }

    // Phone numbers
    const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const phones = content.match(phoneRegex);
    if (phones) {
      detectedPII.push("phones");
      phones.forEach((phone) => {
        changes.push({ type: "phone", original: phone, replacement: "[PHONE]" });
      });
      redacted = redacted.replace(phoneRegex, "[PHONE]");
    }

    // SSN
    const ssnRegex = /\b\d{3}-\d{2}-\d{4}\b/g;
    if (ssnRegex.test(content)) {
      detectedPII.push("ssn");
      redacted = redacted.replace(ssnRegex, "[SSN]");
    }

    // Credit cards
    const ccRegex = /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g;
    if (ccRegex.test(content)) {
      detectedPII.push("credit_cards");
      redacted = redacted.replace(ccRegex, "[CREDIT_CARD]");
    }

    // OpenAI API keys
    const openaiRegex = /sk-[a-zA-Z0-9]{48,}/g;
    if (openaiRegex.test(content)) {
      detectedSecrets.push("openai_api_key");
      redacted = redacted.replace(openaiRegex, "[REDACTED_OPENAI_KEY]");
    }

    // AWS access keys
    const awsRegex = /AKIA[0-9A-Z]{16}/g;
    if (awsRegex.test(content)) {
      detectedSecrets.push("aws_access_key");
      redacted = redacted.replace(awsRegex, "[REDACTED_AWS_KEY]");
    }

    // Generic API keys
    const apiKeyRegex = /(api[_-]?key|apikey|api_secret)[=:\s]["']?[a-zA-Z0-9]{20,}["']?/gi;
    if (apiKeyRegex.test(content)) {
      detectedSecrets.push("api_key");
      redacted = redacted.replace(apiKeyRegex, "[REDACTED_API_KEY]");
    }

    // Passwords in strings
    const passwordRegex = /(password|passwd|pwd)[=:\s]["']?[^\s"'&]{4,}["']?/gi;
    if (passwordRegex.test(content)) {
      detectedSecrets.push("password");
      redacted = redacted.replace(passwordRegex, "password=[REDACTED_PASSWORD]");
    }

    // Bearer tokens
    const bearerRegex = /Bearer\s+[a-zA-Z0-9._-]+/g;
    if (bearerRegex.test(content)) {
      detectedSecrets.push("bearer_token");
      redacted = redacted.replace(bearerRegex, "Bearer [REDACTED_TOKEN]");
    }

    // Connection strings
    const connStringRegex = /(mongodb|postgres|mysql|redis):\/\/[^\s]+/gi;
    if (connStringRegex.test(content)) {
      detectedSecrets.push("connection_string");
      redacted = redacted.replace(connStringRegex, "[REDACTED_CONNECTION_STRING]");
    }

    return {
      partialRedacted: redacted,
      detectedPII,
      detectedSecrets,
      changes,
    };
  }
}

// Singleton instance
let redactionAgentInstance: RedactionAgent | null = null;

export function getRedactionAgent(): RedactionAgent {
  if (!redactionAgentInstance) {
    redactionAgentInstance = new RedactionAgent();
  }
  return redactionAgentInstance;
}
