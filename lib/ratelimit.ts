import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { NextResponse } from 'next/server'
import { logError } from '@/lib/logger'

/**
 * Per-USER rate limiting for API routes (audit H1).
 *
 * The old middleware limits were keyed by IP. The whole campus sits behind a
 * shared NAT, so "5 posts/hour per IP" meant 5 posts/hour for ALL of KIIT.
 * These limiters run inside the route AFTER auth, keyed by the verified
 * user id, so one user can't starve everyone else.
 *
 * Middleware keeps only a generous per-IP backstop against anonymous floods.
 */
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export const userLimiters = {
  /** Creating posts — 5 per hour per user */
  post: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 h'), prefix: 'rlu:post' }),
  /** Submitting claims — 5 per minute per user */
  claim: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '1 m'), prefix: 'rlu:claim' }),
  /** Misc authed API actions — 20 per minute per user */
  action: new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(20, '1 m'), prefix: 'rlu:action' }),
}

/**
 * Returns a 429 response if the user is over the limit, otherwise null.
 * Fails open if Redis is unreachable (documented trade-off — same as middleware).
 */
export async function limitUser(
  limiter: Ratelimit,
  userId: string,
): Promise<NextResponse | null> {
  try {
    const { success, limit, remaining, reset } = await limiter.limit(userId)
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please slow down.' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        },
      )
    }
    return null
  } catch (err) {
    logError('limitUser: Redis unavailable, failing open', err)
    return null
  }
}
