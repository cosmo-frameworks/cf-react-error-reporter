import { sendToGitHub } from "./providers/sendToGithub";
import { sendToGitLab } from "./providers/sendToGitlab";
import { sendToJira } from "./providers/sendToJira";
import { sendToTrello } from "./providers/sendToTrello";

import { ErrorReporterConfigT, IssueT } from "../types";

/**
 * Sends an issue report to the specified provider based on the configuration.
 *
 * @param config - The configuration object containing provider details and credentials.
 * @param issue - The issue object containing details about the error to be reported.
 * @returns A promise that resolves to an object containing the URL of the created issue.
 * @throws Will throw an error if the provider specified in the config is unsupported.
 */
export async function sendToProvider(
  config: ErrorReporterConfigT,
  issue: IssueT
): Promise<{ html_url: string }> {
  switch (config.provider) {
    case "github":
      return sendToGitHub(config, issue);
    case "gitlab":
      return sendToGitLab(config, issue);
    case "jira":
      return sendToJira(config, issue);
    case "trello":
      return sendToTrello(config, issue);
    default:
      throw new Error(`Unsupported provider: ${config.provider}`);
  }
}
