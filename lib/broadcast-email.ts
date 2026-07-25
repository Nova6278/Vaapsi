import { Resend } from 'resend'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { logError } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

const BATCH_SIZE = 100

export type BroadcastPost = {
  id: string
  title: string
  type: 'lost' | 'found'
  description: string
  location: string
  image_url: string | null
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function buildEmailHtml(post: BroadcastPost): string {
  const isFound = post.type === 'found'
  const typeLabel = isFound ? 'Found' : 'Lost'
  const badgeBg = isFound ? '#14301f' : '#3d1515'
  const badgeText = isFound ? '#4ade80' : '#f87171'
  const postUrl = `https://vaapsi.live/posts/${post.id}`
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const imageUrl = post.image_url
    ? `${supabaseUrl}/storage/v1/object/public/post-images/${escapeHtml(post.image_url)}`
    : null

  const imageBlock = imageUrl
    ? `<img src="${imageUrl}" alt="Post image" width="480"
           style="width:100%;max-width:480px;border-radius:12px;margin:16px 0;display:block;object-fit:cover;" />`
    : ''

  const descriptionBlock = post.description
    ? `<p style="font-size:14px;color:#8b92a5;line-height:1.6;margin:8px 0 16px;">${escapeHtml(post.description)}</p>`
    : ''

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#080c18;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#080c18;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#0d1225;border-radius:16px;border:1px solid rgba(255,255,255,0.06);padding:32px;">
        <tr><td>
          <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#4a5068;text-transform:uppercase;">Vaapsi — KIIT Lost &amp; Found</p>
          <h1 style="margin:0 0 20px;font-size:22px;font-weight:700;color:#f0f2f5;line-height:1.3;">New post on campus</h1>

          <span style="display:inline-block;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:700;background:${badgeBg};color:${badgeText};margin-bottom:12px;">${typeLabel}</span>

          <h2 style="margin:0 0 4px;font-size:18px;font-weight:700;color:#f0f2f5;">${escapeHtml(post.title)}</h2>
          <p style="margin:0 0 8px;font-size:13px;color:#8b92a5;">📍 ${escapeHtml(post.location)}</p>

          ${descriptionBlock}
          ${imageBlock}

          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
            <tr><td>
              <a href="${postUrl}"
                 style="display:inline-block;padding:12px 28px;background:#185FA5;color:#fff;border-radius:12px;text-decoration:none;font-size:14px;font-weight:600;">
                View Post →
              </a>
            </td></tr>
          </table>

          <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:28px 0 20px;" />

          <p style="margin:0;font-size:12px;color:#4a5068;line-height:1.6;">
            You're receiving this because you have a Vaapsi account at KIIT.<br>
            This is a campus-wide alert for every new post — not a marketing email.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function broadcastNewPostEmail(
  post: BroadcastPost,
  authorId: string,
): Promise<void> {
  const supabase = createAdminSupabase()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('is_banned', false)
    .neq('id', authorId)
    .not('email', 'is', null)

  if (error) {
    logError('broadcastNewPostEmail: failed to fetch users', error)
    return
  }

  if (!users?.length) return

  const typeLabel = post.type === 'found' ? 'Found' : 'Lost'
  const subject = `New ${typeLabel} post: ${post.title}`
  const html = buildEmailHtml(post)

  const recipients = users

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    const messages = batch.map((u) => ({
      from: 'Vaapsi <noreply@vaapsi.live>',
      to: u.email as string,
      subject,
      html,
    }))

    try {
      await resend.batch.send(messages)
    } catch (err) {
      logError(`broadcastNewPostEmail: batch ${Math.floor(i / BATCH_SIZE) + 1} failed`, err)
    }
  }
}
