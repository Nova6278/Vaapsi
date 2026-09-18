import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getActiveUser } from '@/lib/auth-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { userLimiters, limitUser } from '@/lib/ratelimit'
import { sendNotification } from '@/lib/notify'
import { logError } from '@/lib/logger'

const schema = z.object({
  postId: z.string().uuid(),
})

/**
 * Server-side post deletion (audit M1 / M6).
 *
 * The old flow deleted the post from the browser and then tried to notify
 * claimants via /api/notify — which always returned 403 because the post no
 * longer existed, so claimants were never told. This route collects the
 * claimants BEFORE deleting, deletes with the service-role client, removes
 * the post's storage image, and notifies claimants reliably.
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

  const { data: post } = await admin
    .from('posts')
    .select('user_id, title, photo_url')
    .eq('id', parsed.data.postId)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.user_id !== user.id) {
    return NextResponse.json({ error: 'Not your post' }, { status: 403 })
  }

  const { data: claims } = await admin
    .from('claims')
    .select('claimant_id')
    .eq('post_id', parsed.data.postId)

  const { error: deleteError } = await admin
    .from('posts')
    .delete()
    .eq('id', parsed.data.postId)

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 })
  }

  // Storage cleanup (audit M6) — best-effort, never fails the request.
  if (post.photo_url) {
    const { error: storageError } = await admin.storage
      .from('post-images')
      .remove([post.photo_url])
    if (storageError) logError('posts/delete: image cleanup failed', storageError)
  }

  const uniqueClaimants = [...new Set((claims ?? []).map((c) => c.claimant_id))]
  await Promise.all(
    uniqueClaimants.map((claimantId) =>
      sendNotification(admin, {
        userId: claimantId,
        message: `Post "${post.title}" was deleted by the poster. Your claim has been removed.`,
        type: 'post_deleted',
        email: false,
      }),
    ),
  )

  return NextResponse.json({ success: true })
}
