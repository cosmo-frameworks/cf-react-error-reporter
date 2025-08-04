import { describe, it, expect, vi, beforeEach } from "vitest";

import { getClientContext } from "../../src/lib/utils/context";

describe("getClientContext", () => {
  const mockUserAgent = "VitestAgent/1.0";
  const mockPlatform = "VitestOS";
  const mockHref = "http://localhost/test";

  beforeEach(() => {
    vi.stubGlobal("navigator", {
      userAgent: mockUserAgent,
      platform: mockPlatform,
    });

    vi.stubGlobal("location", {
      href: mockHref,
    });

    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-08-02T12:00:00.000Z"));
  });

  it("should return context string with userAgent, platform, URL and time", () => {
    const context = getClientContext();

    expect(context).toContain(`**User Agent**: ${mockUserAgent}`);
    expect(context).toContain(`**Platform**: ${mockPlatform}`);
    expect(context).toContain(`**URL**: ${mockHref}`);
    expect(context).toContain(`**Time**: 2025-08-02T12:00:00.000Z`);
  });
});
