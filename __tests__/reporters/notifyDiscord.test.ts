import { describe, it, vi, expect, beforeEach } from "vitest";
import { notifyDiscord } from "../../src/lib/reporters/notifyDiscord";
import * as envUtils from "../../src/lib/utils/env";

global.fetch = vi.fn();

describe("notifyDiscord", () => {
  const webhookUrl = "https://discord.com/api/webhooks/1234";
  const issueTitle = "Test Error";
  const issueUrl = "https://github.com/example/repo/issues/1";
  const errorStack = "Error: something broke\n    at App.tsx:1:1";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not send notification if not in production", async () => {
    vi.spyOn(envUtils, "isProduction").mockReturnValue(false);

    await notifyDiscord(webhookUrl, issueTitle, issueUrl, errorStack);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("should send a notification with proper payload in production", async () => {
    vi.spyOn(envUtils, "isProduction").mockReturnValue(true);

    await notifyDiscord(webhookUrl, issueTitle, issueUrl, errorStack);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      webhookUrl,
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.stringContaining("React Error Reporter"),
      })
    );

    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.embeds[0].title).toBe("🚨 Nuevo error reportado");
    expect(body.embeds[0].description).toContain(issueTitle);
    expect(body.embeds[0].description).toContain(issueUrl);
    expect(body.embeds[0].fields[0].value).toContain(errorStack.slice(0, 1000));
  });

  it("should not include 'fields' if errorStack is not provided", async () => {
    vi.spyOn(envUtils, "isProduction").mockReturnValue(true);

    await notifyDiscord(webhookUrl, issueTitle, issueUrl);

    const body = JSON.parse((fetch as any).mock.calls[0][1].body);
    expect(body.embeds[0].fields).toEqual([]);
  });
});
