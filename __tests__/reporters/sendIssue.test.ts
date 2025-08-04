// sendIssueToProvider.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendIssueToProvider } from "../../src/lib/reporters/sendIssue";
import * as env from "../../src/lib/utils/env";
import * as errorCache from "../../src/lib/utils/errorCache";
import * as fingerprint from "../../src/lib/utils/fingerprint";
import * as context from "../../src/lib/utils/context";
import * as sanitizer from "../../src/lib/utils/sanitizer";
import * as pendingQueue from "../../src/lib/utils/pendingQueue";
import * as notify from "../../src/lib/reporters/notifyDiscord";
import { ErrorReporterConfig } from "../../src/lib/types";

global.fetch = vi.fn();

describe("sendIssueToProvider", () => {
  const config: ErrorReporterConfig = {
    apiKey: "test-api-key",
    repo: "test-repo",
    user: "test-user",
    discordWebhook: "https://discord.com/api/webhooks/test",
    onlyInProduction: true,
    provider: "github",
  };

  const error = new Error("Test error");
  error.stack = "stacktrace";

  const info = {
    componentStack: "in App -> in Component",
  };

  beforeEach(() => {
    vi.resetAllMocks();

    vi.spyOn(env, "isProduction").mockReturnValue(true);
    vi.spyOn(errorCache, "shouldReport").mockReturnValue(true);
    vi.spyOn(fingerprint, "generateErrorFingerprint").mockReturnValue(
      "fingerprint123"
    );
    vi.spyOn(context, "getClientContext").mockReturnValue(
      "Browser: Chrome\nOS: macOS"
    );
    vi.spyOn(sanitizer, "sanitize").mockImplementation((str) => str);
    vi.spyOn(pendingQueue, "flushPending").mockImplementation(async (cb) => {});
    vi.spyOn(pendingQueue, "savePending").mockImplementation(() => {});
    vi.spyOn(notify, "notifyDiscord").mockResolvedValue(undefined);
  });

  it("should not send report if not in production and onlyInProduction is true", async () => {
    vi.spyOn(env, "isProduction").mockReturnValue(false);

    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await sendIssueToProvider(config, error, info);

    expect(warn).toHaveBeenCalledWith(
      "Not reporting error in development mode"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should skip report if error was already reported", async () => {
    vi.spyOn(errorCache, "shouldReport").mockReturnValue(false);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendIssueToProvider(config, error, info);

    expect(warn).toHaveBeenCalledWith(
      "Error already reported recently, skipping..."
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should create GitHub issue and notify Discord", async () => {
    const mockGitHubResponse = {
      html_url: "https://github.com/test-user/test-repo/issues/1",
    };

    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockGitHubResponse,
    });

    await sendIssueToProvider(config, error, info);

    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/test-user/test-repo/issues",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Bearer ${config.apiKey}`,
        }),
      })
    );

    expect(notify.notifyDiscord).toHaveBeenCalledWith(
      config.discordWebhook,
      expect.stringContaining("[Runtime Error]"),
      mockGitHubResponse.html_url,
      error.stack
    );
  });

  it("should save issue if GitHub request fails", async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      text: async () => "API limit exceeded",
      status: 403,
    });

    const saveSpy = vi.spyOn(pendingQueue, "savePending");

    await sendIssueToProvider(config, error, info);

    expect(saveSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        title: expect.stringContaining("[Runtime Error]"),
        body: expect.stringContaining("Fingerprint"),
      })
    );
  });
});
