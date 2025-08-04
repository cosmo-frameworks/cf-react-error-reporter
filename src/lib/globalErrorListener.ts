import { getReporterConfig } from "./config";
import { sendIssueToProvider } from "./reporters/sendIssue";

let listenerEnabled = false;

export function enableGlobalCapture() {
  if (listenerEnabled) return;
  listenerEnabled = true;

  window.addEventListener("error", (event: ErrorEvent) => {
    if (event.error instanceof Error) {
      sendIssueToProvider(getReporterConfig(), event.error, {
        componentStack: `Global error at ${event.filename}:${event.lineno}:${event.colno}`,
      });
    }
  });

  window.addEventListener(
    "unhandledrejection",
    (event: PromiseRejectionEvent | any) => {
      const reason = event.reason;
      const error =
        reason instanceof Error ? reason : new Error(String(reason));

      sendIssueToProvider(getReporterConfig(), error, {
        componentStack: "Unhandled Promise Rejection",
      });
    }
  );
}
