import { ErrorReporterConfigT, IssueT } from "../../types";

/**
 * Sends an issue report to a GitHub repository.
 *
 * @param config - The configuration object containing GitHub settings, including the API key, repository, and user.
 * @param issue - The issue object containing the title and body of the error report.
 * @returns A promise that resolves to the response from the GitHub API.
 * @throws Will throw an error if the GitHub configuration is incomplete or if the request fails.
 */
export async function sendToGitHub(config: ErrorReporterConfigT, issue: IssueT) {
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
