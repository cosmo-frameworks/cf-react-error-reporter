import { sha256 } from "js-sha256";

export interface ReactErrorInfoI {
  componentStack: string;
}

/**
 * Generates a unique fingerprint for a given error and its associated React component stack trace.
 *
 * @param error - The error object containing the name, message, and stack trace.
 * @param info - An object containing the React component stack trace.
 * @returns A SHA-256 hash string representing the unique fingerprint of the error and component stack.
 */
export function generateErrorFingerprint(
  error: Error,
  info: ReactErrorInfoI
): string {
  const raw = `${error.name}:${error.message}\n${error.stack}\n${info.componentStack}`;
  return sha256(raw);
}
