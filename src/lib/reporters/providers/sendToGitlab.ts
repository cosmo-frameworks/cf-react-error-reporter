import { ErrorReporterConfigT, IssueT } from "../../types";

/**
 * Sends an error report to a GitLab project as a new issue.
 *
 * @param config - The configuration object containing the GitLab API key and project ID.
 * @param issue - The issue object containing the title and body of the error report.
 * @returns An object containing the URL of the created GitLab issue.
 * @throws Will throw an error if the GitLab configuration is missing or if the API request fails.
 */
export async function sendToGitLab(config: ErrorReporterConfigT, issue: IssueT) {
  if (!config.apiKey || !config.projectId)
    throw new Error("Missing GitLab config");

  const url = `https://gitlab.com/api/v4/projects/${config.projectId}/issues`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "PRIVATE-TOKEN": config.apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: issue.title,
      description: issue.body,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitLab API error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return { html_url: data.web_url };
}
