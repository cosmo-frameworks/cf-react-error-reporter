import { describe, it, expect, vi, beforeEach } from "vitest";

import { sendToGitLab } from "../../../src/lib/reporters/providers/sendToGitlab";
import type { ErrorReporterConfigT, IssueT } from "../../../src/lib/types";

describe("sendToGitLab", () => {
  const mockIssue: IssueT = {
    title: "Bug report",
    body: "Detailed error description",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error if config is missing apiKey or projectId", async () => {
    const configs: Partial<ErrorReporterConfigT>[] = [
      {},
      { apiKey: "abc123" },
      { projectId: "456" },
    ];

    for (const cfg of configs) {
      await expect(
        sendToGitLab(cfg as ErrorReporterConfigT, mockIssue)
      ).rejects.toThrow("Missing GitLab config");
    }
  });

  it("throws error if GitLab API responds with error", async () => {
    const config: ErrorReporterConfigT = {
      provider: "gitlab",
      apiKey: "valid-api-key",
      projectId: "123",
    };

    const mockResponse = {
      ok: false,
      status: 400,
      text: vi.fn().mockResolvedValue("Bad Request"),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(sendToGitLab(config, mockIssue)).rejects.toThrow(
      "GitLab API error: 400 Bad Request"
    );

    expect(fetch).toHaveBeenCalledWith(
      "https://gitlab.com/api/v4/projects/123/issues",
      expect.objectContaining({
        method: "POST",
        headers: {
          "PRIVATE-TOKEN": config.apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: mockIssue.title,
          description: mockIssue.body,
        }),
      })
    );
  });

  it("returns html_url when request succeeds", async () => {
    const config: ErrorReporterConfigT = {
      provider: "gitlab",
      apiKey: "valid-api-key",
      projectId: "789",
    };

    const mockResponseData = {
      web_url: "https://gitlab.com/project/issues/1",
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponseData),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await sendToGitLab(config, mockIssue);

    expect(result).toEqual({ html_url: mockResponseData.web_url });
    expect(fetch).toHaveBeenCalledOnce();
  });
});
