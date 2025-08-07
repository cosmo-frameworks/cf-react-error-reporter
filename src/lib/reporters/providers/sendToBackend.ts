import { ErrorReporterConfigT, IssueT } from "../../types";

/**
 * Sends an issue report to a specified backend service.
 *
 * @param config - The configuration object containing backend settings.
 * @param issue - The issue object containing the title and body of the error report.
 * @returns A promise that resolves to the response from the backend service.
 * @throws Will throw an error if the backendUrl is missing in the config or if the request fails.
 */
export async function sendToBackend(config: ErrorReporterConfigT, issue: IssueT) {
  if (!config.backendUrl) throw new Error("Missing backendUrl in config");

  const res = await fetch(config.backendUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(issue),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Backend error: ${res.status} ${errorText}`);
  }

  return res.json();
}
