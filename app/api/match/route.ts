import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const matchSchema = z.object({
  postId: z.string().uuid(),
  category: z.string().min(1).max(50),
  title: z.string().min(1).max(100),
})

export async function POST(req: Request) {
  const { createServerClient } = await import('@supabase/ssr')
  const { cookies } = await import('next/headers')
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } }
  )
  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = matchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { postId, category, title } = parsed.data

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: post } = await supabase
    .from('posts')
    .select('user_id')
    .eq('id', postId)
    .single()

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })

  // Ownership check — only the post owner may trigger match notifications for it
  if (post.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check if notifications already sent for this found post
  const { data: existingNotifs } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('post_id', postId)

  const alreadyNotified = new Set((existingNotifs ?? []).map(n => n.user_id))

  const { data: matches } = await supabase
    .from('posts')
    .select('id, user_id, title')
    .eq('type', 'lost')
    .eq('category', category)
    .eq('status', 'active')
    .neq('user_id', post.user_id)
    .limit(10)

  if (!matches || matches.length === 0) {
    return NextResponse.json({ matched: 0 })
  }

  const filtered = matches.filter(lost => !alreadyNotified.has(lost.user_id))

  if (filtered.length === 0) {
    return NextResponse.json({ matched: 0 })
  }

  const notifications = filtered.map((lost) => ({
    user_id: lost.user_id,
    message: `A found "${title}" was posted in ${category} — it might be your "${lost.title}"!`,
    claim_id: null,
    post_id: postId,
  }))

  await supabase.from('notifications').insert(notifications)

  return NextResponse.json({ matched: filtered.length })
}