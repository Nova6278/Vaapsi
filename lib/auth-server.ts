import type { User } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { DEMO_ACCOUNT_IDS } from '@/lib/demo'

export type ActiveUserResult =
  | { user: User; error: null }
  | { user: null; error: NextResponse }

/**
 * Shared auth gate for API routes (audit C3).
 *
 * Verifies the session AND that the account is not banned. Middleware's ban
 * check only covers page routes (its rate-limit branch returns early for
 * /api/*), so every API route must call this instead of a bare getUser().
 *
 * Pass { blockDemo: true } for routes demo accounts must not use.
 */
export async function getActiveUser(
  opts: { blockDemo?: boolean } = {},
): Promise<ActiveUserResult> {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { user: null, error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
  }

  if (opts.blockDemo && DEMO_ACCOUNT_IDS.has(user.id)) {
    return { user: null, error: NextResponse.json({ error: 'Demo accounts cannot do this.' }, { status: 403 }) }
  }

  // Read the ban flag with the service-role client so it works regardless of
  // how tightly the users table's RLS is locked down.
  const admin = createAdminSupabase()
  const { data: row } = await admin
    .from('users')
    .select('is_banned')
    .eq('id', user.id)
    .single()

  if (row?.is_banned) {
    return { user: null, error: NextResponse.json({ error: 'Account banned' }, { status: 403 }) }
  }

  return { user, error: null }
}

export function isAdminUser(user: User): boolean {
  return !!process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
}
