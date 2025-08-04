/**
 * Sanitizes sensitive information from a given text string.
 *
 * @param text - The input string that may contain sensitive information such as tokens or email addresses.
 * @returns A sanitized string with sensitive information redacted.
 */
export function sanitize(text: string): string {
  return text
    .replace(/Bearer\s+[a-zA-Z0-9\-_\.]+/g, "[REDACTED_TOKEN]")
    .replace(
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-z]{2,}/gi,
      "[REDACTED_EMAIL]"
    );
}
