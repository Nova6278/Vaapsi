import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { logError } from '@/lib/logger'

// PostgREST refuses unfiltered deletes; "id != nil uuid" matches every row.
const NIL_UUID = '00000000-0000-0000-0000-000000000000'

// Children before parents (FK order).
const TABLES_TO_CLEAR = ['handoff_messages', 'handoffs', 'notifications', 'reports', 'claims', 'suggestions', 'posts'] as const

export async function POST() {
  const forbidden = await requireAdmin()
  if (forbidden) return forbidden

  const admin = createAdminSupabase()

  for (const table of TABLES_TO_CLEAR) {
    const { error } = await admin.from(table).delete().neq('id', NIL_UUID)
    if (error) logError(`admin/reset: clearing ${table} failed`, error)
  }
  const { error: tutorialError } = await admin.from('users').update({ tutorial_done: false }).neq('id', NIL_UUID)
  if (tutorialError) logError('admin/reset: tutorial reset failed', tutorialError)

  return NextResponse.json({ success: true })
}