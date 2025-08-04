import { describe, it, expect, vi, beforeEach } from "vitest";

import { enableGlobalCapture } from "../src/lib/globalErrorListener";
import { sendIssueToProvider } from "../src/lib/reporters/sendIssue";

vi.mock("../src/lib/config", () => ({
  getReporterConfig: () => ({ reporter: "mock" }),
}));

vi.mock("../src/lib/reporters/sendIssue", () => ({
  sendIssueToProvider: vi.fn(),
}));

describe("enableGlobalCapture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (globalThis as any).__listenerEnabled = false;

    window.onerror = null;
    window.onunhandledrejection = null;
  });

  it("should attach error listeners only once", () => {
    enableGlobalCapture();
    const onerror1 = window.onerror;
    enableGlobalCapture();
    const onerror2 = window.onerror;

    expect(onerror1).toBe(onerror2);
  });

  it("should call sendIssueToProvider on window.onerror", () => {
    enableGlobalCapture();

    const error = new Error("Test error");

    window.dispatchEvent(
      new ErrorEvent("error", {
        message: "Some error",
        filename: "file.js",
        lineno: 10,
        colno: 5,
        error,
      })
    );

    expect(sendIssueToProvider).toHaveBeenCalledWith(
      { reporter: "mock" },
      error,
      {
        componentStack: "Global error at file.js:10:5",
      }
    );
  });

  it("should call sendIssueToProvider on window.onunhandledrejection (with Error)", () => {
    enableGlobalCapture();

    const error = new Error("Unhandled rejection");

    const fakeEvent = new CustomEvent("unhandledrejection") as any;
    fakeEvent.reason = error;

    window.dispatchEvent(fakeEvent);

    expect(sendIssueToProvider).toHaveBeenCalledWith(
      { reporter: "mock" },
      error,
      {
        componentStack: "Unhandled Promise Rejection",
      }
    );
  });

  it("should wrap non-Error reasons in Error on rejection", () => {
    enableGlobalCapture();

    const fakeEvent = new CustomEvent("unhandledrejection") as any;
    fakeEvent.reason = "some string reason";

    window.dispatchEvent(fakeEvent);

    const call = (sendIssueToProvider as any).mock.calls[0];
    const passedError = call[1];

    expect(passedError).toBeInstanceOf(Error);
    expect(passedError.message).toBe("some string reason");
  });
});
