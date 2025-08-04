const PENDING_KEY = "__cf_error_pending__";

/**
 * Saves an error to the pending queue in local storage.
 *
 * @param error - The error object to be saved in the pending queue.
 * @returns void
 */
export function savePending(error: any) {
  const existing = getPending();
  existing.push(error);
  localStorage.setItem(PENDING_KEY, JSON.stringify(existing));
}

/**
 * Retrieves the list of pending errors from local storage.
 *
 * @returns An array of pending error objects. If there are no pending errors
 * or if an error occurs during retrieval, an empty array is returned.
 */
export function getPending(): any[] {
  try {
    return JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  } catch {
    return [];
  }
}

/**
 * Processes and attempts to send all pending errors stored in local storage.
 * If sending an error fails, it remains in the pending queue.
 *
 * @param send - A function that takes an error object and returns a promise.
 *               The promise resolves if the error is successfully sent, and
 *               rejects if the sending fails.
 * @returns A promise that resolves when all pending errors have been processed.
 */
export async function flushPending(send: (e: any) => Promise<void>) {
  const queue = getPending();
  const stillPending: any[] = [];

  for (const err of queue) {
    try {
      await send(err);
    } catch {
      stillPending.push(err);
    }
  }

  localStorage.setItem(PENDING_KEY, JSON.stringify(stillPending));
}
