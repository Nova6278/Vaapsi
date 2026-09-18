import { Resend } from 'resend'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { unsubscribeUrl } from '@/lib/unsubscribe'
import { logError } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

const BATCH_SIZE = 100

/** Storage object names we generate: `<uuid>-<timestamp>.<ext>` (audit H3). */
const IMAGE_PATH_RE = /^[a-f0-9-]{36}-\d{10,16}\.(jpe?g|png|webp|gif)$/i

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

function buildEmailHtml(post: BroadcastPost, imageUrl: string | null, unsubLink: string | null): string {
  const isFound = post.type === 'found'
  const typeLabel = isFound ? 'Found' : 'Lost'
  const badgeBg = isFound ? '#14301f' : '#3d1515'
  const badgeText = isFound ? '#4ade80' : '#f87171'
  const postUrl = `https://vaapsi.live/posts/${post.id}`

  const imageBlock = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="Post image" width="480"
           style="width:100%;max-width:480px;border-radius:12px;margin:16px 0;display:block;object-fit:cover;" />`
    : ''

  const descriptionBlock = post.description
    ? `<p style="font-size:14px;color:#8b92a5;line-height:1.6;margin:8px 0 16px;">${escapeHtml(post.description)}</p>`
    : ''

  const unsubBlock = unsubLink
    ? `<br><a href="${unsubLink}" style="color:#4a5068;text-decoration:underline;">Unsubscribe from these alerts</a>`
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
            This is a campus-wide alert for every new post — not a marketing email.${unsubBlock}
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

/**
 * Campus-wide broadcast on new post (audit H3 rewrite).
 *
 * Changes vs. the original:
 * - Image link is a 7-day SIGNED url (post-images is a private bucket; the old
 *   public-object url was broken in every email), and the stored path is
 *   validated against the shape we generate before it goes near a url.
 * - Recipients exclude users who unsubscribed (users.email_opt_out — see
 *   SECURITY_FIXES.sql), and every email carries a signed one-click
 *   unsubscribe link + List-Unsubscribe header (Gmail/Yahoo bulk rules).
 * - Callers must run this via next/server `after()` so it actually finishes
 *   on Vercel instead of being frozen mid-loop when the response returns.
 */
export async function broadcastNewPostEmail(
  post: BroadcastPost,
  authorId: string,
): Promise<void> {
  const supabase = createAdminSupabase()

  const { data: users, error } = await supabase
    .from('users')
    .select('id, email')
    .eq('is_banned', false)
    .eq('email_opt_out', false)
    .neq('id', authorId)
    .not('email', 'is', null)

  if (error) {
    logError('broadcastNewPostEmail: failed to fetch users', error)
    return
  }

  if (!users?.length) return

  let imageUrl: string | null = null
  if (post.image_url && IMAGE_PATH_RE.test(post.image_url)) {
    try {
      const { data: signed } = await supabase.storage
        .from('post-images')
        .createSignedUrl(post.image_url, 60 * 60 * 24 * 7)
      imageUrl = signed?.signedUrl ?? null
    } catch (err) {
      logError('broadcastNewPostEmail: signed url failed', err)
    }
  }

  const typeLabel = post.type === 'found' ? 'Found' : 'Lost'
  const subject = `New ${typeLabel} post: ${post.title}`

  const recipients = users

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    const messages = batch.map((u) => {
      const unsubLink = unsubscribeUrl(u.id)
      return {
        from: 'Vaapsi <noreply@vaapsi.live>',
        to: u.email as string,
        subject,
        html: buildEmailHtml(post, imageUrl, unsubLink),
        ...(unsubLink
          ? {
              headers: {
                'List-Unsubscribe': `<${unsubLink}>`,
                'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
              },
            }
          : {}),
      }
    })

    try {
      await resend.batch.send(messages)
    } catch (err) {
      logError(`broadcastNewPostEmail: batch ${Math.floor(i / BATCH_SIZE) + 1} failed`, err)
    }
  }
}
