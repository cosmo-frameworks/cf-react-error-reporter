import { render } from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { ErrorBoundary } from "../src/lib/ErrorBoundary";
import { sendIssueToProvider } from "../src/lib/reporters/sendIssue";

vi.mock("../src/lib/config", () => ({
  getReporterConfig: () => ({ reporter: "mock" }),
}));

vi.mock("../src/lib/reporters/sendIssue", () => ({
  sendIssueToProvider: vi.fn(),
}));


const ThrowError = () => {
  throw new Error("Test error");
};

describe("ErrorBoundary (basic, no jest-dom)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders children when there is no error", () => {
    const { container } = render(
      <ErrorBoundary>
        <div>Normal content</div>
      </ErrorBoundary>
    );

    expect(container.textContent).toContain("Normal content");
  });

  it("renders fallback when error is thrown", () => {
    const { container } = render(
      <ErrorBoundary fallback={<div>Fallback UI</div>}>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(container.textContent).toContain("Fallback UI");
  });

  it("renders default fallback when error is thrown and no fallback is provided", () => {
    const { container } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(container.textContent).toContain("Something went wrong.");
  });

  it("calls sendIssueToProvider when an error is caught", () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(sendIssueToProvider).toHaveBeenCalledTimes(1);
    const [config, error, info] = (sendIssueToProvider as any).mock.calls[0];
    expect(config).toEqual({ reporter: "mock" });
    expect(error).toBeInstanceOf(Error);
    expect(error.message).toBe("Test error");
    expect(info).toBeDefined();
  });
});
