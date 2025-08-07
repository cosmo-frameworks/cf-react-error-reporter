import { notifyDiscord } from "./notifyDiscord";
import { sendToProvider } from "./sendToProvider";
import { sendToBackend } from "./providers/sendToBackend";

import { sanitize } from "../utils/sanitizer";
import { shouldReport } from "../utils/errorCache";
import { isProduction } from "../utils/env";
import { getClientContext } from "../utils/context";
import { generateErrorFingerprint } from "../utils/fingerprint";
import { savePending, flushPending } from "../utils/pendingQueue";

import { ErrorReporterConfigT, IssueT } from "../types";

/**
 * Sends an error report to the appropriate provider based on the configuration.
 * It checks if the error should be reported, generates a fingerprint for the error,
 * and attempts to send the report. If the report fails, it saves the issue for later retry.
 *
 * @param config - The configuration object for error reporting, which includes settings
 *                 such as mode, API keys, URLs, and whether to report only in production.
 * @param error - The error object that contains the error message and stack trace.
 * @param info - The React error info object that contains the component stack trace.
 * @returns A promise that resolves when the error report has been processed.
 */
export async function sendIssueToProvider(
  config: ErrorReporterConfigT,
  error: Error,
  info: React.ErrorInfo
) {
  if (!isProduction() && config.onlyInProduction) {
    console.warn("Not reporting error in development mode");
    return;
  }

  if (!shouldReport(error)) {
    console.warn("Error already reported recently, skipping...");
    return;
  }

  const fingerprint = generateErrorFingerprint(error, {
    componentStack: info.componentStack ?? "",
  });

  const issue: IssueT = {
    title: sanitize(`[Runtime Error] ${error.message}`),
    body: sanitize(`
${getClientContext()}

**Fingerprint**: \`${fingerprint}\`

**Error**: ${error.message}

**Stack**:
\`\`\`
${error.stack}
\`\`\`

**Component Stack**:
\`\`\`
${info.componentStack}
\`\`\`
`),
  };

  try {
    await flushPending((e) => sendToAppropriateTarget(config, e));

    const createdIssue = await sendToAppropriateTarget(config, issue);

    if (config.discordWebhook && isProduction()) {
      await notifyDiscord(
        config.discordWebhook,
        issue.title,
        createdIssue.html_url,
        error.stack || ""
      );
    }
  } catch (err) {
    console.error("Failed to report error:", err);
    savePending(issue);
  }
}

/**
 * Determines the appropriate target for sending an issue report based on the configuration mode
 * and attempts to send the report to that target.
 *
 * @param config - The configuration object containing settings for error reporting, including mode, API keys, and URLs.
 * @param issue - The issue object containing the title and body of the error report.
 * @returns A promise that resolves to the response from the target service (GitHub or backend).
 * @throws Will attempt to send to GitHub first if in frontend mode, and fall back to backend if GitHub reporting fails.
 */
async function sendToAppropriateTarget(
  config: ErrorReporterConfigT,
  issue: IssueT
) {
  if (config.mode === "backend") {
    return sendToBackend(config, issue);
  }

  if (config.mode === "frontend") {
    return sendToProvider(config, issue);
  }

  try {
    return await sendToProvider(config, issue);
  } catch (e) {
    console.warn("Frontend reporting failed, falling back to backend...");
    return await sendToBackend(config, issue);
  }
}
