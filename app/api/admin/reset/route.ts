import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL!

export async function POST() {
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

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  await admin.from('handoff_messages').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('handoffs').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('notifications').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('reports').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('claims').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('suggestions').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('users').update({ tutorial_done: false }).neq('id', '00000000-0000-0000-0000-000000000000')

  return NextResponse.json({ success: true })
}