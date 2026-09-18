import { createHmac } from 'node:crypto'

/**
 * HMAC signing for one-click unsubscribe links (audit H3).
 * Set UNSUBSCRIBE_SECRET in env; falls back to the service-role key so the
 * feature works without extra setup (rotate both together if ever leaked).
 */
export function unsubscribeSecret(): string | null {
  return process.env.UNSUBSCRIBE_SECRET ?? process.env.SUPABASE_SERVICE_ROLE_KEY ?? null
}

export function signUnsubscribe(userId: string): string | null {
  const key = unsubscribeSecret()
  if (!key) return null
  return createHmac('sha256', key).update(userId).digest('hex')
}

export function unsubscribeUrl(userId: string): string | null {
  const sig = signUnsubscribe(userId)
  if (!sig) return null
  return `https://vaapsi.live/api/unsubscribe?uid=${encodeURIComponent(userId)}&sig=${sig}`
}
