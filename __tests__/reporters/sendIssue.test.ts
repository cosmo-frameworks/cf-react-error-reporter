import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendIssueToProvider } from "../../src/lib/reporters/sendIssue";

import * as env from "../../src/lib/utils/env";
import * as errorCache from "../../src/lib/utils/errorCache";
import * as fingerprint from "../../src/lib/utils/fingerprint";
import * as context from "../../src/lib/utils/context";
import * as sanitizer from "../../src/lib/utils/sanitizer";
import * as pendingQueue from "../../src/lib/utils/pendingQueue";
import * as notify from "../../src/lib/reporters/notifyDiscord";

import * as backend from "../../src/lib/reporters/providers/sendToBackend";
import * as provider from "../../src/lib/reporters/sendToProvider";

import { ErrorReporterConfigT } from "../../src/lib/types";

const mockError = new Error("Something went wrong");
const mockInfo = { componentStack: "at App > Button" };

const baseConfig: ErrorReporterConfigT = {
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
  vi.spyOn(pendingQueue, "flushPending").mockImplementation(
    async (fn) =>
      await fn({
        title: "Pending Error",
        body: "This is pending",
      })
  );
  vi.spyOn(pendingQueue, "savePending").mockImplementation(() => {});
  vi.spyOn(notify, "notifyDiscord").mockResolvedValue();

  vi.spyOn(provider, "sendToProvider").mockResolvedValue({
    html_url: "https://github.com/issues/1",
  });

  vi.spyOn(backend, "sendToBackend").mockResolvedValue({
    html_url: "https://backend.com/fallback",
  });
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
    expect(provider.sendToProvider).not.toHaveBeenCalled();
    expect(backend.sendToBackend).not.toHaveBeenCalled();
  });

  it("should skip reporting if error was already reported", async () => {
    vi.spyOn(errorCache, "shouldReport").mockReturnValue(false);
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await sendIssueToProvider(baseConfig, mockError, mockInfo);

    expect(warnSpy).toHaveBeenCalledWith(
      "Error already reported recently, skipping..."
    );
    expect(provider.sendToProvider).not.toHaveBeenCalled();
  });

  it("should send issue to provider and notify Discord", async () => {
    await sendIssueToProvider(baseConfig, mockError, mockInfo);

    expect(provider.sendToProvider).toHaveBeenCalled();
    expect(notify.notifyDiscord).toHaveBeenCalledWith(
      baseConfig.discordWebhook,
      expect.stringContaining("[Runtime Error]"),
      "https://github.com/issues/1",
      mockError.stack
    );
  });

  it("should fallback to backend if provider fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const config: ErrorReporterConfigT = { ...baseConfig, mode: "auto" };

    vi.spyOn(provider, "sendToProvider").mockRejectedValueOnce(
      new Error("Provider failed")
    );

    await sendIssueToProvider(config, mockError, mockInfo);

    expect(warnSpy).toHaveBeenCalledWith(
      "Frontend reporting failed, falling back to backend..."
    );
    expect(backend.sendToBackend).toHaveBeenCalled();
  });

  it("should save issue to pending queue if all fails", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const config: ErrorReporterConfigT = { ...baseConfig, mode: "auto" };

    vi.spyOn(provider, "sendToProvider").mockRejectedValueOnce(
      new Error("fail")
    );
    vi.spyOn(backend, "sendToBackend").mockRejectedValueOnce(
      new Error("fail again")
    );

    await sendIssueToProvider(config, mockError, mockInfo);

    expect(errorSpy).toHaveBeenCalledWith(
      "Failed to report error:",
      expect.any(Error)
    );
    expect(pendingQueue.savePending).toHaveBeenCalled();
  });

  it("should send to backend directly if mode is 'backend'", async () => {
    const config: ErrorReporterConfigT = { ...baseConfig, mode: "backend" };

    await sendIssueToProvider(config, mockError, mockInfo);

    expect(provider.sendToProvider).not.toHaveBeenCalled();
    expect(backend.sendToBackend).toHaveBeenCalledWith(
      expect.any(Object),
      expect.any(Object)
    );
  });

  it("should not call notifyDiscord if not in production", async () => {
    vi.spyOn(env, "isProduction").mockReturnValue(false);

    const config = {
      ...baseConfig,
      discordWebhook: "https://discord.com/webhook",
      onlyInProduction: false,
    };

    await sendIssueToProvider(config, mockError, mockInfo);

    expect(notify.notifyDiscord).not.toHaveBeenCalled();
  });
});
