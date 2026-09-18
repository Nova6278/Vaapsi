import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActiveUser } from '@/lib/auth-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { userLimiters, limitUser } from '@/lib/ratelimit'

const schema = z.object({
  handoffId: z.string().uuid(),
})

/**
 * Server-side handoff completion (audit H4).
 *
 * The old completeHandoff ran entirely in the browser: the isOwner check and
 * the "both parties sent ≥2 messages" rule were client-side, and it updated
 * handoffs + posts with the user's own token. This route enforces all of it
 * with the service-role client — only user_1 (the post owner) can complete.
 */
export async function POST(req: NextRequest) {
  const { user, error } = await getActiveUser({ blockDemo: true })
  if (error) return error

  const limited = await limitUser(userLimiters.action, user.id)
  if (limited) return limited

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const admin = createAdminSupabase()

  const { data: handoff } = await admin
    .from('handoffs')
    .select('id, post_id, user_1, user_2, status')
    .eq('id', parsed.data.handoffId)
    .single()

  if (!handoff) return NextResponse.json({ error: 'Handoff not found' }, { status: 404 })
  if (handoff.user_1 !== user.id) {
    return NextResponse.json({ error: 'Only the post owner can complete a handoff' }, { status: 403 })
  }
  if (handoff.status !== 'active') {
    return NextResponse.json({ error: 'Handoff is not active' }, { status: 409 })
  }

  const { data: messages } = await admin
    .from('handoff_messages')
    .select('sender_id')
    .eq('handoff_id', handoff.id)

  const mine = (messages ?? []).filter((m) => m.sender_id === user.id).length
  const theirs = (messages ?? []).length - mine
  if (mine < 2 || theirs < 2) {
    return NextResponse.json(
      { error: 'Both parties must send at least 2 messages before completing.' },
      { status: 409 },
    )
  }

  const [r1, r2, r3] = await Promise.all([
    admin
      .from('handoff_messages')
      .update({ is_read: true })
      .eq('handoff_id', handoff.id)
      .eq('is_read', false),
    admin
      .from('handoffs')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', handoff.id),
    admin.from('posts').update({ status: 'resolved' }).eq('id', handoff.post_id),
  ])

  if (r1.error || r2.error || r3.error) {
    return NextResponse.json({ error: 'Failed to complete handoff. Please try again.' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
