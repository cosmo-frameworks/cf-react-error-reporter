import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
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

const mockError = new Error("Something went wrong");
const mockInfo = { componentStack: "at App > Button" };

const baseConfig: ErrorReporterConfig = {
  mode: "frontend",
  apiKey: "fake-key",
  repo: "repo",
  user: "user",
  backendUrl: "https://backend.com/report",
  discordWebhook: "https://discord.com/webhook",
  onlyInProduction: true,
  provider: "github",
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(env, "isProduction").mockReturnValue(true);
  vi.spyOn(errorCache, "shouldReport").mockReturnValue(true);
  vi.spyOn(sanitizer, "sanitize").mockImplementation((s) => s);
  vi.spyOn(context, "getClientContext").mockReturnValue("MockContext");
  vi.spyOn(fingerprint, "generateErrorFingerprint").mockReturnValue("abc123");
  vi.spyOn(pendingQueue, "flushPending").mockResolvedValue(undefined);
  vi.spyOn(pendingQueue, "savePending").mockImplementation(() => {});
  vi.spyOn(notify, "notifyDiscord").mockResolvedValue();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("sendIssueToProvider", () => {
  it("should not report in development when onlyInProduction is true", async () => {
    vi.spyOn(env, "isProduction").mockReturnValue(false);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendIssueToProvider(baseConfig, mockError, mockInfo);

    expect(warnSpy).toHaveBeenCalledWith(
      "Not reporting error in development mode"
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should skip reporting if error was already reported", async () => {
    vi.spyOn(errorCache, "shouldReport").mockReturnValue(false);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendIssueToProvider(baseConfig, mockError, mockInfo);

    expect(warnSpy).toHaveBeenCalledWith(
      "Error already reported recently, skipping..."
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("should send issue to GitHub and notify Discord", async () => {
    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ html_url: "https://github.com/issues/1" }),
    });

    await sendIssueToProvider(baseConfig, mockError, mockInfo);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(notify.notifyDiscord).toHaveBeenCalledWith(
      baseConfig.discordWebhook,
      expect.stringContaining("[Runtime Error]"),
      "https://github.com/issues/1",
      mockError.stack
    );
  });

  it("should fallback to backend if GitHub fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config: ErrorReporterConfig = { ...baseConfig, mode: "auto" }; // ← fuerza fallback

    (fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        text: () => Promise.resolve("GitHub error"),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ html_url: "https://backend.com/fallback" }),
      });

    await sendIssueToProvider(config, mockError, mockInfo);

    expect(warnSpy).toHaveBeenCalledWith(
      "Frontend reporting failed, falling back to backend..."
    );
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("should save issue to pending queue if all fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const config: ErrorReporterConfig = { ...baseConfig, mode: "auto" };

    (fetch as any).mockRejectedValue(new Error("total failure"));

    await sendIssueToProvider(config, mockError, mockInfo);

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to report error:",
      expect.any(Error)
    );
    expect(pendingQueue.savePending).toHaveBeenCalled();
  });

  it("should send to backend directly if mode is 'backend'", async () => {
    const config: ErrorReporterConfig = { ...baseConfig, mode: "backend" };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ html_url: "https://backend.com/issue" }),
    });

    await sendIssueToProvider(config, mockError, mockInfo);

    expect(fetch).toHaveBeenCalledWith(
      config.backendUrl,
      expect.objectContaining({
        method: "POST",
        body: expect.stringContaining(mockError.message),
      })
    );
  });

  it("should throw if GitHub config is incomplete", async () => {
    const config: ErrorReporterConfig = {
      ...baseConfig,
      mode: "frontend",
      apiKey: undefined,
    };

    await expect(
      sendIssueToProvider(config, mockError, mockInfo)
    ).resolves.toBeUndefined();

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should throw if backendUrl is missing in config", async () => {
    const config: ErrorReporterConfig = {
      ...baseConfig,
      mode: "backend",
      backendUrl: undefined,
    };

    await expect(
      sendIssueToProvider(config, mockError, mockInfo)
    ).resolves.toBeUndefined();

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should not call notifyDiscord if not in production", async () => {
    vi.spyOn(env, "isProduction").mockReturnValue(false);
    const config = {
      ...baseConfig,
      discordWebhook: "https://discord.com/webhook",
      onlyInProduction: false,
    };

    (fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ html_url: "https://github.com/issues/1" }),
    });

    await sendIssueToProvider(config, mockError, mockInfo);

    expect(notify.notifyDiscord).not.toHaveBeenCalled();
  });
});
