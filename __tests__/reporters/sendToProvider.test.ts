import { describe, it, expect, vi, beforeEach } from "vitest";

import { sendToProvider } from "../../src/lib/reporters/sendToProvider";
import { sendToGitHub } from "../../src/lib/reporters/providers/sendToGithub";
import { sendToGitLab } from "../../src/lib/reporters/providers/sendToGitlab";
import { sendToJira } from "../../src/lib/reporters/providers/sendToJira";
import { sendToTrello } from "../../src/lib/reporters/providers/sendToTrello";

import type { ErrorReporterConfigT, IssueT } from "../../src/lib/types";

vi.mock("../../src/lib/reporters/providers/sendToGithub", () => ({
  sendToGitHub: vi.fn(),
}));

vi.mock("../../src/lib/reporters/providers/sendToGitlab", () => ({
  sendToGitLab: vi.fn(),
}));

vi.mock("../../src/lib/reporters/providers/sendToJira", () => ({
  sendToJira: vi.fn(),
}));

vi.mock("../../src/lib/reporters/providers/sendToTrello", () => ({
  sendToTrello: vi.fn(),
}));

describe("sendToProvider", () => {
  const mockIssue: IssueT = {
    title: "Test Issue",
    body: "This is a test",
  };

  const mockResponse = { html_url: "https://example.com/issue/1" };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls sendToGitHub when provider is github", async () => {
    const config: ErrorReporterConfigT = {
      provider: "github",
      apiKey: "token",
      user: "octocat",
      repo: "test-repo",
    };

    (sendToGitHub as any).mockResolvedValue(mockResponse);

    const result = await sendToProvider(config, mockIssue);

    expect(sendToGitHub).toHaveBeenCalledWith(config, mockIssue);
    expect(result).toEqual(mockResponse);
  });

  it("calls sendToGitLab when provider is gitlab", async () => {
    const config: ErrorReporterConfigT = {
      provider: "gitlab",
      apiKey: "token",
      projectId: "123",
    };

    (sendToGitLab as any).mockResolvedValue(mockResponse);

    const result = await sendToProvider(config, mockIssue);

    expect(sendToGitLab).toHaveBeenCalledWith(config, mockIssue);
    expect(result).toEqual(mockResponse);
  });

  it("calls sendToJira when provider is jira", async () => {
    const config: ErrorReporterConfigT = {
      provider: "jira",
      apiKey: "token",
      user: "email@example.com",
      jiraDomain: "company.atlassian.net",
      jiraProjectKey: "PROJ",
    };

    (sendToJira as any).mockResolvedValue(mockResponse);

    const result = await sendToProvider(config, mockIssue);

    expect(sendToJira).toHaveBeenCalledWith(config, mockIssue);
    expect(result).toEqual(mockResponse);
  });

  it("calls sendToTrello when provider is trello", async () => {
    const config: ErrorReporterConfigT = {
      provider: "trello",
      apiKey: "key",
      trelloBoardId: "board-id",
      trelloListId: "list-id",
      trelloToken: "token",
    };

    (sendToTrello as any).mockResolvedValue(mockResponse);

    const result = await sendToProvider(config, mockIssue);

    expect(sendToTrello).toHaveBeenCalledWith(config, mockIssue);
    expect(result).toEqual(mockResponse);
  });

  it("throws error for unsupported provider", async () => {
    const config: ErrorReporterConfigT = {
      provider: "asana",
    };

    await expect(sendToProvider(config, mockIssue)).rejects.toThrow(
      "Unsupported provider: asana"
    );
  });
});
