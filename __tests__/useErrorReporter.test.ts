import { describe, it, expect, vi, beforeEach } from "vitest";

let useErrorReporter: any;
let reportTestError: any;
let sendIssueToProvider: any;

vi.mock("../src/lib/config", () => ({
  getReporterConfig: () => ({ reporter: "mock" }),
}));

beforeEach(async () => {
  vi.resetModules();
  vi.clearAllMocks();

  sendIssueToProvider = vi.fn();

  vi.doMock("../src/lib/reporters/sendIssue", () => ({
    sendIssueToProvider,
  }));

  const mod = await import("../src/lib/useErrorReporter");
  useErrorReporter = mod.useErrorReporter;
  reportTestError = mod.reportTestError;
});

describe("useErrorReporter", () => {
  it("should call sendIssueToProvider with default context when context is not provided", () => {
    const { reportError } = useErrorReporter();

    const error = new Error("Some error");
    reportError(error);

    expect(sendIssueToProvider).toHaveBeenCalledWith(
      { reporter: "mock" },
      error,
      { componentStack: "Reported manually via hook" }
    );
  });

  it("should call sendIssueToProvider with provided context", () => {
    const { reportError } = useErrorReporter();

    const error = new Error("Another error");
    const context = "ComponentX stack trace";

    reportError(error, context);

    expect(sendIssueToProvider).toHaveBeenCalledWith(
      { reporter: "mock" },
      error,
      { componentStack: context }
    );
  });
});

describe("reportTestError", () => {
  it("should send a test error with correct message and context", async () => {
    await reportTestError();

    expect(sendIssueToProvider).toHaveBeenCalledTimes(1);

    const [config, error, context] = sendIssueToProvider.mock.calls[0];

    expect(config).toEqual({ reporter: "mock" });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Test error from react-error-reporter");
    expect(context).toEqual({ componentStack: "Manual test trigger" });
  });
});
