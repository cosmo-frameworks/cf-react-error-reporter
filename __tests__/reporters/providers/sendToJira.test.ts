import { describe, it, expect, vi, beforeEach } from "vitest";

import { sendToJira } from "../../../src/lib/reporters/providers/sendToJira";
import type { ErrorReporterConfigT, IssueT } from "../../../src/lib/types";

describe("sendToJira", () => {
  const mockIssue: IssueT = {
    title: "Jira bug",
    body: "Something failed in production",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("throws error if config is missing required fields", async () => {
    const incompleteConfigs: Partial<ErrorReporterConfigT>[] = [
      {},
      { apiKey: "key" },
      { apiKey: "key", jiraProjectKey: "PRJ" },
      {
        apiKey: "key",
        jiraProjectKey: "PRJ",
        jiraDomain: "domain.atlassian.net",
      },
    ];

    for (const config of incompleteConfigs) {
      await expect(
        sendToJira(config as ErrorReporterConfigT, mockIssue)
      ).rejects.toThrow("Missing Jira config");
    }
  });

  it("throws error if Jira API returns an error", async () => {
    const config: ErrorReporterConfigT = {
      provider: "jira",
      apiKey: "test-api-key",
      jiraProjectKey: "TEST",
      jiraDomain: "example.atlassian.net",
      user: "testuser@example.com",
    };

    const mockResponse = {
      ok: false,
      status: 403,
      text: vi.fn().mockResolvedValue("Forbidden"),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(sendToJira(config, mockIssue)).rejects.toThrow(
      "Jira API error: 403 Forbidden"
    );

    const expectedAuth = btoa(`${config.user}:${config.apiKey}`);

    expect(fetch).toHaveBeenCalledWith(
      `https://${config.jiraDomain}/rest/api/3/issue`,
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: `Basic ${expectedAuth}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
        body: JSON.stringify({
          fields: {
            project: { key: config.jiraProjectKey },
            summary: mockIssue.title,
            description: mockIssue.body,
            issuetype: { name: "Bug" },
          },
        }),
      })
    );
  });

  it("returns issue URL when request succeeds", async () => {
    const config: ErrorReporterConfigT = {
      provider: "jira",
      apiKey: "test-api-key",
      jiraProjectKey: "TEST",
      jiraDomain: "example.atlassian.net",
      user: "testuser@example.com",
    };

    const mockResponseData = {
      key: "TEST-123",
    };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockResponseData),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await sendToJira(config, mockIssue);

    expect(result).toEqual({
      html_url: `https://${config.jiraDomain}/browse/${mockResponseData.key}`,
    });

    expect(fetch).toHaveBeenCalledOnce();
  });
});
