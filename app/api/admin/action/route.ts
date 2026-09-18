import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

const schema = z.object({
  action: z.enum(['warn', 'ban', 'unban', 'delete']),
  reportedUserId: z.string().uuid().optional(),
  postId: z.string().uuid().optional(),
  banReason: z.string().optional(),
})

export async function POST(req: Request) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: unknown
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { action, reportedUserId, postId, banReason } = parsed.data

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  if (action === 'warn') {
    if (!reportedUserId) return NextResponse.json({ error: 'Missing reportedUserId' }, { status: 400 })
    await admin.from('users').update({ warning_issued: true }).eq('id', reportedUserId)
    await admin.from('notifications').insert({
      user_id: reportedUserId,
      message: '⚠️ Warning: Your account has received a report. Further violations will result in a permanent ban.',
      type: 'admin',
      is_read: false,
    })
  } else if (action === 'ban') {
    if (!reportedUserId) return NextResponse.json({ error: 'Missing reportedUserId' }, { status: 400 })
    await admin.from('users').update({ is_banned: true, ban_reason: banReason ?? 'Violation' }).eq('id', reportedUserId)
    await admin.from('notifications').insert({
      user_id: reportedUserId,
      message: '🚫 Your account has been permanently banned from Vaapsi due to violations of community guidelines.',
      type: 'admin',
      is_read: false,
    })
  } else if (action === 'unban') {
    if (!reportedUserId) return NextResponse.json({ error: 'Missing reportedUserId' }, { status: 400 })
    await admin.from('users').update({ is_banned: false, ban_reason: null, warning_issued: false }).eq('id', reportedUserId)
  } else if (action === 'delete') {
    if (!postId) return NextResponse.json({ error: 'Missing postId' }, { status: 400 })
    // Fetch photo path first so storage can be cleaned up (audit M6).
    const { data: post } = await admin.from('posts').select('photo_url').eq('id', postId).single()
    const { error: deleteError } = await admin.from('posts').delete().eq('id', postId)
    if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })
    if (post?.photo_url) {
      await admin.storage.from('post-images').remove([post.photo_url])
    }
  }

  return NextResponse.json({ success: true })
}