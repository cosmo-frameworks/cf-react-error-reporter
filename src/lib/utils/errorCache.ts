const errorCache = new Set<string>();
let lastReport = 0;

/**
 * Determines whether an error should be reported based on debounce and duplication rules.
 *
 * @param error - The error object to evaluate for reporting.
 * @returns A boolean indicating if the error should be reported. Returns `true` if the error
 *          is eligible for reporting, otherwise `false`.
 */
export function shouldReport(error: Error): boolean {
  const key = error.message + error.stack;
  const now = Date.now();

  if (now - lastReport < 10000) return false;

  if (errorCache.has(key)) return false;

  errorCache.add(key);
  setTimeout(() => errorCache.delete(key), 60000);
  lastReport = now;
  return true;
}
