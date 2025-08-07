import { describe, it, expect, vi, beforeEach } from "vitest";

import { sendToBackend } from "../../../src/lib/reporters/providers/sendToBackend";
import type { ErrorReporterConfigT, IssueT } from "../../../src/lib/types";

describe("sendToBackend", () => {
  const mockIssue: IssueT = {
    title: "Test Error",
    body: "Something went wrong",
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should throw if config.backendUrl is missing", async () => {
    const config = {} as ErrorReporterConfigT;
    await expect(sendToBackend(config, mockIssue)).rejects.toThrow(
      "Missing backendUrl in config"
    );
  });

  it("should throw if backend returns an error", async () => {
    const config: ErrorReporterConfigT = {
      provider: "github",
      backendUrl: "https://api.example.com/report",
    };

    const mockResponse = {
      ok: false,
      status: 500,
      text: vi.fn().mockResolvedValue("Internal Server Error"),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    await expect(sendToBackend(config, mockIssue)).rejects.toThrow(
      "Backend error: 500 Internal Server Error"
    );

    expect(fetch).toHaveBeenCalledWith(config.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockIssue),
    });
  });

  it("should return JSON when request is successful", async () => {
    const config: ErrorReporterConfigT = {
      provider: "github",
      backendUrl: "https://api.example.com/report",
    };

    const mockData = { success: true };

    const mockResponse = {
      ok: true,
      json: vi.fn().mockResolvedValue(mockData),
    };

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(mockResponse));

    const result = await sendToBackend(config, mockIssue);
    expect(result).toEqual(mockData);

    expect(fetch).toHaveBeenCalledWith(config.backendUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mockIssue),
    });
  });
});
