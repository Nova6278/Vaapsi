import { NextResponse } from 'next/server'

/**
 * REMOVED (audit H4).
 *
 * Handoff creation now happens inside /api/claims/decide, atomically with the
 * claim confirmation it belongs to, so the client no longer performs the
 * two-step "update claim, then create handoff" dance. Completion moved to
 * /api/handoff/complete with server-side ownership + message-count checks.
 *
 * The file stays so the route returns a clean 410 instead of a 404/405 for
 * any stale client still calling it.
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Gone — use /api/claims/decide (creates the handoff) instead.' },
    { status: 410 },
  )
}
