export type ModeT = "frontend" | "backend" | "auto";

export type ErrorReporterConfigT = {
  provider: "github";
  apiKey?: string;
  repo: string;
  user: string;
  backendUrl?: string;
  mode?: "frontend" | "backend" | "auto";
  discordWebhook?: string;
  onlyInProduction?: boolean;
};
