/**
 * Retrieves a string containing client context information.
 *
 * @returns A string that includes the user's agent, platform, current URL, and the current time in ISO format.
 */
export function getClientContext(): string {
  return `
  **User Agent**: ${navigator.userAgent}
  **Platform**: ${navigator.platform}
  **URL**: ${location.href}
  **Time**: ${new Date().toISOString()}`;
}
