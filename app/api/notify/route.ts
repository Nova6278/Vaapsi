import { NextResponse } from 'next/server'

/**
 * REMOVED (audit C2).
 *
 * This endpoint accepted a caller-supplied recipient id + free-form message
 * and delivered it as an in-app notification AND an email from
 * noreply@vaapsi.live — any user who owned any post could phish any other
 * user through it. Notifications are now created server-side with fixed
 * templates inside the routes that own each event:
 *   - claim submitted   → /api/claims/create
 *   - claim decided     → /api/claims/decide
 *   - post deleted      → /api/posts/delete
 *   - match found       → /api/match
 *   - admin actions     → /api/admin/action, /api/admin/suggestion
 *
 * The file stays so the route returns a clean 410 instead of a 404/405 for
 * any stale client still calling it.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Gone — notifications are created server-side now.' },
    { status: 410 },
  )
}
