/**
 * Lightweight error logger. Logs to console only outside production so we don't
 * leak internal error details in the production client/server bundles.
 */
export function logError(context: string, error: unknown): void {
  if (process.env.NODE_ENV !== "production") {
    console.error(context, error);
  }
}
