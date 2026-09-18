import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActiveUser } from '@/lib/auth-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { userLimiters, limitUser } from '@/lib/ratelimit'
import { sanitize, LIMITS, containsProfanity } from '@/lib/sanitize'
import { sendNotification } from '@/lib/notify'

const schema = z.object({
  postId: z.string().uuid(),
  answer: z.string().min(1).max(LIMITS.claim_answer),
})

/**
 * Server-side claim submission (audit H4).
 *
 * The old flow inserted claims from the browser and its "server-side" guards
 * (own-post check, duplicate check) actually ran client-side, so they were
 * bypassable. This route enforces everything on the server and creates the
 * owner's notification itself (closing the /api/notify hole, audit C2).
 */
export async function POST(req: NextRequest) {
  const { user, error } = await getActiveUser({ blockDemo: true })
  if (error) return error

  const limited = await limitUser(userLimiters.claim, user.id)
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

  const answer = sanitize(parsed.data.answer, LIMITS.claim_answer)
  if (!answer) return NextResponse.json({ error: 'Answer cannot be empty' }, { status: 400 })
  if (containsProfanity(answer)) {
    return NextResponse.json({ error: 'Your answer contains inappropriate language.' }, { status: 400 })
  }

  const admin = createAdminSupabase()

  const { data: post } = await admin
    .from('posts')
    .select('user_id, title, type, status')
    .eq('id', parsed.data.postId)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.user_id === user.id) {
    return NextResponse.json({ error: 'You cannot claim your own post.' }, { status: 403 })
  }
  if (post.status !== 'active') {
    return NextResponse.json({ error: 'This post is no longer active.' }, { status: 409 })
  }

  const { data: existing } = await admin
    .from('claims')
    .select('id')
    .eq('post_id', parsed.data.postId)
    .eq('claimant_id', user.id)
    .limit(1)

  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'You have already submitted a claim on this post.' }, { status: 409 })
  }

  const { data: claim, error: insertError } = await admin
    .from('claims')
    .insert({
      post_id: parsed.data.postId,
      claimant_id: user.id,
      answer,
      status: 'pending',
    })
    .select('id')
    .single()

  if (insertError || !claim) {
    // unique constraint race (see SECURITY_FIXES.sql) → treat as duplicate
    if (insertError?.code === '23505') {
      return NextResponse.json({ error: 'You have already submitted a claim on this post.' }, { status: 409 })
    }
    return NextResponse.json({ error: insertError?.message ?? 'Claim failed' }, { status: 500 })
  }

  await sendNotification(admin, {
    userId: post.user_id,
    message: `Someone claimed your post: ${post.title}`,
    type: 'claim_submitted',
    claimId: claim.id,
    postId: parsed.data.postId,
    email: true,
  })

  return NextResponse.json({ success: true, claimId: claim.id })
}
