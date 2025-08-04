import { sanitize } from "../utils/sanitizer";
import { shouldReport } from "../utils/errorCache";
import { isProduction } from "../utils/env";
import { getClientContext } from "../utils/context";
import { generateErrorFingerprint } from "../utils/fingerprint";
import { savePending, flushPending } from "../utils/pendingQueue";

import { ErrorReporterConfig } from "../types";

import { notifyDiscord } from "./notifyDiscord";

/**
 * Sends an error report to a specified provider, such as GitHub or Discord.
 *
 * @param config - The configuration object for the error reporter, including provider details and options.
 * @param error - The error object containing the error message and stack trace.
 * @param info - Additional error information, specifically the React component stack.
 * @returns A promise that resolves when the error report has been successfully sent or saved for later.
 */
export async function sendIssueToProvider(
  config: ErrorReporterConfig,
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

  const issue = {
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
\`\`\``),
  };

  try {
    await flushPending((err) => sendToGitHub(config, err));
    const createdIssue = await sendToGitHub(config, issue);

    if (config.discordWebhook) {
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
 * Sends an issue to a GitHub repository as a new issue.
 *
 * @param config - The configuration object containing GitHub API details.
 * @param config.apiKey - The API key for authenticating with GitHub.
 * @param config.repo - The name of the GitHub repository.
 * @param config.user - The GitHub username or organization name.
 * @param issue - The issue object containing the title and body of the issue.
 * @param issue.title - The title of the issue to be created.
 * @param issue.body - The body content of the issue, typically including error details.
 * @returns A promise that resolves to the JSON response from the GitHub API if the request is successful.
 * @throws Will throw an error if the GitHub configuration is missing or if the API request fails.
 */
async function sendToGitHub(
  config: ErrorReporterConfig,
  issue: { title: string; body: string }
) {
  if (!config.apiKey || !config.repo || !config.user)
    throw new Error("Missing GitHub config");

  const url = `https://api.github.com/repos/${config.user}/${config.repo}/issues`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      Accept: "application/vnd.github.v3+json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(issue),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API error: ${res.status} ${errorText}`);
  }

  return res.json();
}
