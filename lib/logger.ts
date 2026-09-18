/**
 * Error logger (audit M2).
 *
 * The old version was a no-op in production, which made every server-side
 * failure (broadcast emails, notification inserts, storage cleanup) silently
 * invisible — there was no way to see WHY something broke in prod. Server
 * logs go to Vercel's log stream and are never shown to end users, so
 * logging in production is safe and necessary. Client-side, console.error
 * only reaches that user's own devtools.
 */
export function logError(context: string, error: unknown): void {
  console.error(context, error);
}
