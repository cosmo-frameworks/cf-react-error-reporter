import { describe, it, expect, vi, beforeEach } from "vitest";

import { sendToTrello } from "../../../src/lib/reporters/providers/sendToTrello";
import type { ErrorReporterConfigT, IssueT } from "../../../src/lib/types";

describe("sendToTrello", () => {
  const mockIssue: IssueT = {
    title: "Trello bug",
    body: "Something went wrong on the board",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error if Trello config is incomplete", async () => {
    const invalidConfigs: Partial<ErrorReporterConfigT>[] = [
      {},
      { apiKey: "key" },
      { apiKey: "key", trelloBoardId: "board123" },
    ];

    for (const config of invalidConfigs) {
      await expect(
        sendToTrello(config as ErrorReporterConfigT, mockIssue)
      ).rejects.toThrow("Missing Trello config");
    }
  });

  it("throws error if Trello API returns an error", async () => {
    const config: ErrorReporterConfigT = {
      provider: "trello",
      apiKey: "valid-key",
      trelloBoardId: "board123",
      trelloListId: "list456",
      trelloToken: "valid-token",
    };

    const mockErrorResponse = {
      ok: false,
      status: 401,
      text: vi.fn().mockResolvedValue("Unauthorized"),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse));

    await expect(sendToTrello(config, mockIssue)).rejects.toThrow(
      "Trello API error: 401 Unauthorized"
    );

    expect(fetch).toHaveBeenCalledWith(
      `https://api.trello.com/1/cards?key=${config.apiKey}&token=${config.trelloToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: mockIssue.title,
          desc: mockIssue.body,
          idList: config.trelloListId,
        }),
      }
    );
  });

  it("returns Trello card URL when successful", async () => {
    const config: ErrorReporterConfigT = {
      provider: "trello",
      apiKey: "valid-key",
      trelloBoardId: "board123",
      trelloListId: "list456",
      trelloToken: "valid-token",
    };

    const mockResponseData = {
      shortUrl: "https://trello.com/c/abc123",
    };

    const mockSuccessResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponseData),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockSuccessResponse));

    const result = await sendToTrello(config, mockIssue);

    expect(result).toEqual({ html_url: mockResponseData.shortUrl });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
