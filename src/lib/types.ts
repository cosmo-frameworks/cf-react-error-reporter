export type ModeT = "frontend" | "backend" | "auto";

export type SupportedProvidersT = "github" | "gitlab" | "jira" | "trello";

export type IssueT = { title: string; body: string };

export type ErrorReporterConfigT = {
  provider: SupportedProvidersT;
  apiKey?: string;
  repo?: string;
  user?: string;
  projectId?: string;
  jiraProjectKey?: string;
  jiraDomain?: string;
  trelloBoardId?: string;
  trelloListId?: string;
  trelloToken?: string;
  backendUrl?: string;
  mode?: "frontend" | "backend" | "auto";
  discordWebhook?: string;
  onlyInProduction?: boolean;
};
