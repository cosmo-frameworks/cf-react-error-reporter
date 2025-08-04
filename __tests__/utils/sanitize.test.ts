import { describe, it, expect } from "vitest";

import { sanitize } from "../../src/lib/utils/sanitizer";

describe("sanitize", () => {
  it("should redact Bearer tokens", () => {
    const input = "Authorization: Bearer abc123XYZ.token-part";
    const result = sanitize(input);
    expect(result).toBe("Authorization: [REDACTED_TOKEN]");
  });

  it("should redact email addresses", () => {
    const input = "Contact us at support@example.com";
    const result = sanitize(input);
    expect(result).toBe("Contact us at [REDACTED_EMAIL]");
  });

  it("should redact both tokens and emails in one string", () => {
    const input =
      "User john.doe@example.com used token Bearer abc123.def456 to access.";
    const result = sanitize(input);
    expect(result).toBe(
      "User [REDACTED_EMAIL] used token [REDACTED_TOKEN] to access."
    );
  });

  it("should handle strings without sensitive data", () => {
    const input = "No sensitive data here!";
    const result = sanitize(input);
    expect(result).toBe(input);
  });

  it("should handle multiple emails and tokens", () => {
    const input =
      "Emails: one@example.com, two@example.org. Tokens: Bearer token1 Bearer token2";
    const result = sanitize(input);
    expect(result).toBe(
      "Emails: [REDACTED_EMAIL], [REDACTED_EMAIL]. Tokens: [REDACTED_TOKEN] [REDACTED_TOKEN]"
    );
  });
});
