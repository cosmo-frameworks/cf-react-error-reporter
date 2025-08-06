/**
 * Determines if the current environment is production.
 *
 * @returns {boolean} `true` if the `NODE_ENV` environment variable is set to "production", otherwise `false`.
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === "production";
}
