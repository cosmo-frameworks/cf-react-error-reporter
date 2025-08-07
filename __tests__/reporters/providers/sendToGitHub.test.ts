import { describe, it, expect, vi, beforeEach } from "vitest";

import { sendToGitHub } from "../../../src/lib/reporters/providers/sendToGithub";
import type { ErrorReporterConfigT, IssueT } from "../../../src/lib/types";

describe("sendToGitHub", () => {
  const mockIssue: IssueT = {
    title: "GitHub bug",
    body: "There was a failure in production",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error if GitHub config is incomplete", async () => {
    const invalidConfigs: Partial<ErrorReporterConfigT>[] = [
      {},
      { apiKey: "token" },
      { apiKey: "token", user: "octocat" },
    ];

    for (const config of invalidConfigs) {
      await expect(
        sendToGitHub(config as ErrorReporterConfigT, mockIssue)
      ).rejects.toThrow("Missing GitHub config");
    }
  });

  it("throws error if GitHub API returns an error", async () => {
    const config: ErrorReporterConfigT = {
      provider: "github",
      apiKey: "ghp_validToken",
      repo: "my-repo",
      user: "octocat",
    };

    const mockErrorResponse = {
      ok: false,
      status: 404,
      text: vi.fn().mockResolvedValue("Not Found"),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockErrorResponse));

    await expect(sendToGitHub(config, mockIssue)).rejects.toThrow(
      "GitHub API error: 404 Not Found"
    );

    expect(fetch).toHaveBeenCalledWith(
      `https://api.github.com/repos/${config.user}/${config.repo}/issues`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(mockIssue),
      }
    );
  });

  it("returns response JSON when GitHub request is successful", async () => {
    const config: ErrorReporterConfigT = {
      provider: "github",
      apiKey: "ghp_validToken",
      repo: "my-repo",
      user: "octocat",
    };

    const mockResponseData = {
      id: 123456,
      html_url: "https://github.com/octocat/my-repo/issues/1",
    };

    const mockSuccessResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponseData),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockSuccessResponse));

    const result = await sendToGitHub(config, mockIssue);

    expect(result).toEqual(mockResponseData);
    expect(fetch).toHaveBeenCalledOnce();
  });
});
