import { getReporterConfig } from "./config";
import { sendIssueToProvider } from "./reporters/sendIssue";

/**
 * Provides a hook for reporting errors to a configured issue provider.
 *
 * This hook returns a function that can be used to report errors,
 * optionally including additional context information.
 *
 * @returns An object containing the `reportError` function.
 */
export function useErrorReporter() {
  /**
   * Reports an error to the configured issue provider.
   *
   * @param error - The error object to be reported.
   * @param context - Optional additional context information, such as a component stack trace.
   */
  function reportError(error: Error, context?: string) {
    sendIssueToProvider(getReporterConfig(), error, {
      componentStack: context || "Reported manually via hook",
    });
  }

  return { reportError };
}

/**
 * Triggers a test error report to the configured issue provider.
 *
 * This function creates a test error and sends it to the issue provider
 * using the current reporter configuration. It is primarily used for
 * testing the error reporting setup.
 *
 * @returns A promise that resolves when the test error has been sent.
 */
export async function reportTestError() {
  const error = new Error("Test error from react-error-reporter");
  await sendIssueToProvider(getReporterConfig(), error, {
    componentStack: "Manual test trigger",
  });
}
