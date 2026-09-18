import { Resend } from 'resend'
import type { SupabaseClient } from '@supabase/supabase-js'
import { logError } from '@/lib/logger'

const resend = new Resend(process.env.RESEND_API_KEY)

export type NotificationType =
  | 'claim_submitted'
  | 'claim_confirmed'
  | 'claim_rejected'
  | 'post_deleted'
  | 'match'
  | 'admin'

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

/**
 * Server-only notification helper (audit C2 / M1).
 *
 * All notifications are now created HERE, on the server, with a message the
 * server composed itself. No API route accepts caller-supplied recipient ids
 * or free-form message text anymore — that combination let any user send
 * arbitrary emails from noreply@vaapsi.live to any other user.
 */
export async function sendNotification(
  admin: SupabaseClient,
  opts: {
    userId: string
    message: string
    type: NotificationType
    claimId?: string | null
    postId?: string | null
    email?: boolean
    emailSubject?: string
  },
): Promise<void> {
  const { error: notifError } = await admin.from('notifications').insert({
    user_id: opts.userId,
    message: opts.message,
    type: opts.type,
    claim_id: opts.claimId ?? null,
    post_id: opts.postId ?? null,
  })

  if (notifError) {
    logError('sendNotification: insert failed', notifError)
    return
  }

  if (!opts.email) return

  try {
    const { data: userData, error: userError } = await admin.auth.admin.getUserById(opts.userId)
    if (userError || !userData?.user?.email) return

    const safeMessage = escapeHtml(opts.message)
    await resend.emails.send({
      from: 'Vaapsi <noreply@vaapsi.live>',
      to: userData.user.email,
      subject: opts.emailSubject ?? 'New notification from Vaapsi',
      html: `
        <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #111;">Vaapsi — Lost &amp; Found</h2>
          <p style="font-size: 16px; color: #333;">${safeMessage}</p>
          <a href="https://vaapsi.live/notifications"
             style="display: inline-block; margin-top: 16px; padding: 10px 20px;
                    background: #000; color: #fff; border-radius: 8px;
                    text-decoration: none; font-weight: 600;">
            View Notifications
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #999;">
            You're receiving this because you have an account on Vaapsi.
          </p>
        </div>
      `,
    })
  } catch (err) {
    logError('sendNotification: email failed', err)
  }
}
