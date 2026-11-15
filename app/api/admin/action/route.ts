import { NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdmin } from '@/lib/auth-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { logError } from '@/lib/logger'

const WARN_MESSAGE = '⚠️ Warning: Your account has received a report. Further violations will result in a permanent ban.'
const BAN_MESSAGE = '🚫 Your account has been permanently banned from Vaapsi due to violations of community guidelines.'

/** These writes never failed the request before; keep that, but stop hiding the failure. */
function logIfError(context: string, result: { error: unknown }): void {
  if (result.error) logError(`admin/action: ${context} failed`, result.error)
}

const schema = z.object({
  action: z.enum(['warn', 'ban', 'unban', 'delete']),
  reportedUserId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  banReason: z.string().optional(),
})

export async function POST(req: Request) {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { action, reportedUserId, postId, banReason } = parsed.data

  const admin = createAdminSupabase()

  if (action === 'warn') {
    if (!reportedUserId) return NextResponse.json({ error: 'Missing reportedUserId' }, { status: 400 })
    logIfError('warn update', await admin.from('users').update({ warning_issued: true }).eq('id', reportedUserId))
    logIfError('warn notification', await admin.from('notifications').insert({
      user_id: reportedUserId,
      message: WARN_MESSAGE,
      type: 'admin',
      is_read: false,
    }))
  } else if (action === 'ban') {
    if (!reportedUserId) return NextResponse.json({ error: 'Missing reportedUserId' }, { status: 400 })
    logIfError('ban update', await admin.from('users').update({ is_banned: true, ban_reason: banReason ?? 'Violation' }).eq('id', reportedUserId))
    logIfError('ban notification', await admin.from('notifications').insert({
      user_id: reportedUserId,
      message: BAN_MESSAGE,
      type: 'admin',
      is_read: false,
    }))
  } else if (action === 'unban') {
    if (!reportedUserId) return NextResponse.json({ error: 'Missing reportedUserId' }, { status: 400 })
    logIfError('unban update', await admin.from('users').update({ is_banned: false, ban_reason: null, warning_issued: false }).eq('id', reportedUserId))
  } else if (action === 'delete') {
    if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })
    // Fetch photo path first so storage can be cleaned up (audit M6).
    const { data: post } = await admin.from('posts').select('photo_url').eq('id', postId).single()
    const { error: deleteError } = await admin.from('posts').delete().eq('id', postId)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
    if (post?.photo_url) {
      logIfError('image cleanup', await admin.storage.from('post-images').remove([post.photo_url]))
    }
  }

  return NextResponse.json({ success: true })
}