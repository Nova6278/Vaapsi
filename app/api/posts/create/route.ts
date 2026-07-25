import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { broadcastNewPostEmail } from '@/lib/broadcast-email'
import { logError } from '@/lib/logger'
import { DEMO_ACCOUNT_IDS } from '@/lib/demo'

const createPostSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().min(1).max(100),
  category: z.string().min(1).max(50),
  location: z.string().min(1).max(100),
  description: z.string().max(500).optional().default(''),
  verification_question: z.string().max(200).optional().default(''),
  photo_url: z.string().max(500).nullable().optional(),
})

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { get: (name) => cookieStore.get(name)?.value } },
  )

  const { data: { user } } = await supabaseAuth.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (DEMO_ACCOUNT_IDS.has(user.id)) {
    return NextResponse.json({ error: 'Demo accounts cannot create posts.' }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = createPostSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 })
  }

  const { type, title, category, location, description, verification_question, photo_url } = parsed.data

  const supabase = createAdminSupabase()

  const { data: newPost, error: insertError } = await supabase
    .from('posts')
    .insert({
      type,
      title,
      category,
      location,
      description,
      verification_question: type === 'found' ? verification_question : '',
      user_id: user.id,
      status: 'active',
      photo_url: photo_url ?? null,
    })
    .select('id')
    .single()

  if (insertError || !newPost) {
    logError('Post insert failed:', insertError)
    return NextResponse.json({ error: insertError?.message ?? 'Insert failed' }, { status: 500 })
  }

  // Fire broadcast async — does not block the response
  broadcastNewPostEmail(
    {
      id: newPost.id,
      title,
      type,
      description: description ?? '',
      location,
      image_url: photo_url ?? null,
    },
    user.id,
  ).catch((err) => logError('broadcastNewPostEmail threw:', err))

  return NextResponse.json({ success: true, post: { id: newPost.id } })
}
