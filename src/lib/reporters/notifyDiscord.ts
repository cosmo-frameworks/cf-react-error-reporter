import { isProduction } from "../utils/env";

/**
 * This function sends a notification to a Discord channel using a webhook URL.
 * It is designed to report errors in a React application to a dedicated Discord channel.
 *
 * @param webhookUrl - The URL of the Discord webhook.
 * @param issueTitle - The title of the error issue.
 * @param issueUrl - The URL of the error issue on GitHub.
 * @param errorStack - (Optional) The stack trace of the error. If provided, it will be included in the Discord notification.
 *
 * @returns {Promise<void>} - The function returns a Promise that resolves when the notification is sent successfully.
 */
export async function notifyDiscord(
  webhookUrl: string,
  issueTitle: string,
  issueUrl: string,
  errorStack?: string
) {
  if (!isProduction()) return;

  const embed = {
    title: `🚨 Nuevo error reportado`,
    description: `**${issueTitle}**\n[Ver issue en GitHub](${issueUrl})`,
    color: 0xff4f4f,
    timestamp: new Date().toISOString(),
    fields: errorStack
      ? [
          {
            name: "Stack",
            value: "```" + errorStack.slice(0, 1000) + "```",
          },
        ]
      : [],
  };

  await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "React Error Reporter",
      avatar_url: "https://cosmoframeworks.shakarzr.com/logo.png", 
      embeds: [embed],
    }),
  });
}
