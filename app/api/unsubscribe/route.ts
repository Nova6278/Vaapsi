import { NextRequest, NextResponse } from 'next/server'
import { timingSafeEqual } from 'node:crypto'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { signUnsubscribe } from '@/lib/unsubscribe'
import { logError } from '@/lib/logger'

export const runtime = 'nodejs'

function page(title: string, body: string): NextResponse {
  return new NextResponse(
    `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>${title} — Vaapsi</title></head>
<body style="margin:0;background:#080c18;min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;padding:24px;">
  <div style="background:#0d1225;border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:40px 32px;max-width:420px;width:100%;text-align:center;">
    <h1 style="color:#f0f2f5;font-size:20px;margin:0 0 8px;">${title}</h1>
    <p style="color:#8b92a5;font-size:14px;line-height:1.6;margin:0;">${body}</p>
  </div>
</body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } },
  )
}

/**
 * One-click unsubscribe from campus-wide broadcast emails (audit H3).
 *
 * Links are signed with an HMAC so a user can only unsubscribe themselves.
 * GET so it works from any mail client; only flips a boolean, so safe.
 */
export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid')
  const sig = req.nextUrl.searchParams.get('sig')

  if (!uid || !sig) return page('Invalid link', 'This unsubscribe link is incomplete.')

  const expected = signUnsubscribe(uid)
  if (!expected) return page('Unavailable', 'Unsubscribe is not configured. Please contact the admin.')

  const a = Buffer.from(sig)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return page('Invalid link', 'This unsubscribe link is not valid.')
  }

  const admin = createAdminSupabase()
  const { error } = await admin.from('users').update({ email_opt_out: true }).eq('id', uid)
  if (error) {
    logError('unsubscribe: update failed', error)
    return page('Something went wrong', 'Could not unsubscribe you. Please try again later.')
  }

  return page(
    'Unsubscribed',
    'You will no longer receive new-post broadcast emails from Vaapsi. Claim and account emails still arrive.',
  )
}
