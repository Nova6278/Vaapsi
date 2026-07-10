import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { sanitize } from '@/lib/sanitize'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!
const REPLY_MAX = 1000

const schema = z.object({
  suggestionId: z.string().uuid(),
  reply: z.string().min(1).max(REPLY_MAX),
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

  const reply = sanitize(parsed.data.reply, REPLY_MAX)
  if (!reply) return NextResponse.json({ error: 'Reply cannot be empty' }, { status: 400 })

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: updated, error } = await admin
    .from('suggestions')
    .update({ admin_reply: reply, status: 'resolved', resolved_at: new Date().toISOString() })
    .eq('id', parsed.data.suggestionId)
    .select('user_id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const preview = reply.length > 100 ? `${reply.slice(0, 100)}…` : reply
  await admin.from('notifications').insert({
    user_id: updated.user_id,
    message: `Your suggestion was marked resolved. Admin reply: ${preview}`,
    claim_id: null,
    post_id: null,
  })

  return NextResponse.json({ success: true })
}
