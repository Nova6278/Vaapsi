import { NextResponse } from 'next/server'

/**
 * REMOVED (audit H4).
 *
 * Match notifications are now generated server-side inside
 * /api/posts/create (via next/server `after()`), so they can't be spoofed
 * with a mismatched title/category and aren't lost when the poster closes
 * the tab before this second request fired.
 *
 * The file stays so the route returns a clean 410 instead of a 404/405 for
 * any stale client still calling it.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Gone — matching now runs inside /api/posts/create.' },
    { status: 410 },
  )
}
