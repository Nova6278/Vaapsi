import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActiveUser } from '@/lib/auth-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { userLimiters, limitUser } from '@/lib/ratelimit'
import { sendNotification } from '@/lib/notify'

const schema = z.object({
  claimId: z.string().uuid(),
  decision: z.enum(['confirmed', 'rejected']),
})

/**
 * Server-side claim decision (audit H4).
 *
 * Replaces the old browser-side claims.status update + /api/handoff call.
 * Ownership, single-confirmation, and handoff creation are all enforced here
 * with the service-role client, and the claimant's notification is composed
 * server-side (audit C2).
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

  const { claimId, decision } = parsed.data
  const admin = createAdminSupabase()

  const { data: claim } = await admin
    .from('claims')
    .select('id, post_id, claimant_id, status')
    .eq('id', claimId)
    .single()

  if (!claim) return NextResponse.json({ error: 'Claim not found' }, { status: 404 })

  const { data: post } = await admin
    .from('posts')
    .select('user_id, title')
    .eq('id', claim.post_id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.user_id !== user.id) {
    return NextResponse.json({ error: 'Not your post' }, { status: 403 })
  }
  if (claim.status !== 'pending') {
    return NextResponse.json({ error: 'Claim already decided' }, { status: 409 })
  }

  let handoffId: string | null = null

  if (decision === 'confirmed') {
    const { data: alreadyConfirmed } = await admin
      .from('claims')
      .select('id')
      .eq('post_id', claim.post_id)
      .eq('status', 'confirmed')
      .limit(1)

    if (alreadyConfirmed && alreadyConfirmed.length > 0) {
      return NextResponse.json({ error: 'A claim is already confirmed for this post.' }, { status: 409 })
    }

    const { error: updateError } = await admin
      .from('claims')
      .update({ status: 'confirmed' })
      .eq('id', claimId)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

    // Create (or reuse) the handoff chat between owner and claimant.
    const { data: existingHandoff } = await admin
      .from('handoffs')
      .select('id')
      .eq('post_id', claim.post_id)
      .maybeSingle()

    if (existingHandoff) {
      handoffId = existingHandoff.id
    } else {
      const { data: handoff, error: handoffError } = await admin
        .from('handoffs')
        .insert({ post_id: claim.post_id, user_1: user.id, user_2: claim.claimant_id })
        .select('id')
        .single()

      if (handoffError || !handoff) {
        // Roll back so the owner can retry cleanly.
        await admin.from('claims').update({ status: 'pending' }).eq('id', claimId)
        return NextResponse.json({ error: 'Failed to create handoff. Please try again.' }, { status: 500 })
      }
      handoffId = handoff.id
    }
  } else {
    const { error: updateError } = await admin
      .from('claims')
      .update({ status: 'rejected' })
      .eq('id', claimId)
    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  await sendNotification(admin, {
    userId: claim.claimant_id,
    message:
      decision === 'confirmed'
        ? `Your claim for "${post.title}" was confirmed! 🎉`
        : `Your claim for "${post.title}" was rejected.`,
    type: decision === 'confirmed' ? 'claim_confirmed' : 'claim_rejected',
    claimId,
    postId: claim.post_id,
    email: true,
  })

  return NextResponse.json({ success: true, handoffId })
}
