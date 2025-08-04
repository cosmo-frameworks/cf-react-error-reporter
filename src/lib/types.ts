export type Mode = "frontend" | "backend" | "auto";

export type ErrorReporterConfig = {
  provider: "github";
  apiKey?: string;
  repo: string;
  user: string;
  backendUrl?: string;
  mode?: "frontend" | "backend" | "auto";
  discordWebhook?: string;
  onlyInProduction?: boolean;
};
