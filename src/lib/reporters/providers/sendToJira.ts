import { ErrorReporterConfigT, IssueT } from "../../types";

/**
 * Sends an issue report to Jira.
 *
 * @param config - The configuration object containing Jira API credentials and project details.
 * @param issue - The issue object containing the title and body of the issue to be reported.
 * @returns An object containing the URL of the created Jira issue.
 * @throws Will throw an error if the Jira configuration is incomplete or if the Jira API request fails.
 */
export async function sendToJira(config: ErrorReporterConfigT, issue: IssueT) {
  if (
    !config.apiKey ||
    !config.jiraProjectKey ||
    !config.jiraDomain ||
    !config.user
  )
    throw new Error("Missing Jira config");

  const url = `https://${config.jiraDomain}/rest/api/3/issue`;

  const auth = btoa(`${config.user}:${config.apiKey}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: { key: config.jiraProjectKey },
        summary: issue.title,
        description: issue.body,
        issuetype: { name: "Bug" },
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Jira API error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return {
    html_url: `https://${config.jiraDomain}/browse/${data.key}`,
  };
}
