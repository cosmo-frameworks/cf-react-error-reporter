import { ErrorReporterConfigT, IssueT } from "../../types";

/**
 * Sends an issue to a specified Trello board and list as a new card.
 *
 * @param config - The configuration object containing Trello API credentials and board/list identifiers.
 * @param issue - The issue object containing the title and body of the issue to be reported.
 * @returns An object containing the URL of the created Trello card.
 * @throws Will throw an error if the Trello configuration is incomplete or if the Trello API request fails.
 */
export async function sendToTrello(
  config: ErrorReporterConfigT,
  issue: IssueT
) {
  if (!config.apiKey || !config.trelloBoardId || !config.trelloListId)
    throw new Error("Missing Trello config");

  const url = `https://api.trello.com/1/cards?key=${config.apiKey}&token=${config.trelloToken}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: issue.title,
      desc: issue.body,
      idList: config.trelloListId,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Trello API error: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  return { html_url: data.shortUrl };
}
