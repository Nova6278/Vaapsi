import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { sanitize } from '@/lib/sanitize'
import { logError } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

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
  const message = `Your suggestion was marked resolved. Admin reply: ${preview}`

  const { error: notifError } = await admin.from('notifications').insert({
    user_id: updated.user_id,
    message,
    type: 'admin',
    claim_id: null,
    post_id: null,
  })

  if (notifError) {
    logError('Failed to insert suggestion notification:', notifError)
    return NextResponse.json({ error: 'Notification failed: ' + notifError.message }, { status: 500 })
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(updated.user_id)
  if (!userError && userData?.user?.email) {
    const safeMessage = message.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    resend.emails.send({
      from: 'Vaapsi <noreply@vaapsi.live>',
      to: userData.user.email,
      subject: 'Your suggestion has been resolved',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">Vaapsi — Lost & Found</h2>
          <p style="font-size: 16px; color: #333;">${safeMessage}</p>
          <a href="https://vaapsi.live/notifications"
             style="display: inline-block; margin-top: 16px; padding: 10px 20px;
                    background: #000; color: #fff; border-radius: 8px;
                    text-decoration: none; font-weight: 600;">
            View Notifications
          </a>
        </div>
      `,
    }).catch((err: unknown) => logError('Suggestion resolved email failed:', err))
  }

  return NextResponse.json({ success: true })
}
