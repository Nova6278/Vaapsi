import { NextRequest, NextResponse } from 'next/server'
import { after } from 'next/server'
import { z } from 'zod'
import { getActiveUser } from '@/lib/auth-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { userLimiters, limitUser } from '@/lib/ratelimit'
import { sanitize, LIMITS, containsProfanity } from '@/lib/sanitize'
import { broadcastNewPostEmail } from '@/lib/broadcast-email'
import { logError } from '@/lib/logger'

/** Storage object names we generate client-side: `<uuid>-<timestamp>.<ext>` (audit H3/M5). */
const PHOTO_PATH_RE = /^[a-f0-9-]{36}-\d{10,16}\.(jpe?g|png|webp|gif)$/i

const createPostSchema = z.object({
  type: z.enum(['lost', 'found']),
  title: z.string().min(1).max(LIMITS.title),
  category: z.string().min(1).max(LIMITS.category),
  location: z.string().min(1).max(LIMITS.location),
  description: z.string().max(LIMITS.description).optional().default(''),
  verification_question: z.string().max(LIMITS.verification_question).optional().default(''),
  photo_url: z.string().regex(PHOTO_PATH_RE, 'Invalid photo path').nullable().optional(),
})

export async function POST(req: NextRequest) {
  // Audit C3: getActiveUser also rejects banned accounts (a banned user could
  // previously still post — and each post emails the whole campus).
  const { user, error } = await getActiveUser({ blockDemo: true })
  if (error) return error

  // Audit H1: rate limit per USER, not per campus-shared IP.
  const limited = await limitUser(userLimiters.post, user.id)
  if (limited) return limited

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

  // Audit H4: sanitization + profanity filter enforced server-side too
  // (previously client-only, so trivially bypassable).
  const cleaned = {
    type: parsed.data.type,
    title: sanitize(parsed.data.title, LIMITS.title),
    category: sanitize(parsed.data.category, LIMITS.category),
    location: sanitize(parsed.data.location, LIMITS.location),
    description: sanitize(parsed.data.description ?? '', LIMITS.description),
    verification_question:
      parsed.data.type === 'found'
        ? sanitize(parsed.data.verification_question ?? '', LIMITS.verification_question)
        : '',
  }

  if (!cleaned.title || !cleaned.category || !cleaned.location) {
    return NextResponse.json({ error: 'Title, category, and location are required.' }, { status: 400 })
  }

  const fieldsToCheck = [cleaned.title, cleaned.location, cleaned.description, cleaned.verification_question]
  if (fieldsToCheck.some((f) => containsProfanity(f))) {
    return NextResponse.json({ error: 'Your post contains inappropriate language. Please revise.' }, { status: 400 })
  }

  const supabase = createAdminSupabase()

  const { data: newPost, error: insertError } = await supabase
    .from('posts')
    .insert({
      ...cleaned,
      user_id: user.id,
      status: 'active',
      photo_url: parsed.data.photo_url ?? null,
    })
    .select('id')
    .single()

  if (insertError || !newPost) {
    logError('Post insert failed:', insertError)
    return NextResponse.json({ error: insertError?.message ?? 'Insert failed' }, { status: 500 })
  }

  // Audit H3: `after()` runs once the response is sent but BEFORE Vercel
  // freezes the function — the old fire-and-forget promise could be killed
  // mid-loop and silently send nothing.
  after(async () => {
    await broadcastNewPostEmail(
      {
        id: newPost.id,
        title: cleaned.title,
        type: cleaned.type,
        description: cleaned.description,
        location: cleaned.location,
        image_url: parsed.data.photo_url ?? null,
      },
      user.id,
    ).catch((err) => logError('broadcastNewPostEmail threw:', err))

    // Audit H4: match notifications moved server-side (the old client-side
    // fire-and-forget /api/match call was lost if the tab closed).
    if (cleaned.type === 'found') {
      await notifyMatches(supabase, newPost.id, user.id, cleaned.category, cleaned.title).catch(
        (err) => logError('notifyMatches threw:', err),
      )
    }
  })

  return NextResponse.json({ success: true, post: { id: newPost.id } })
}

async function notifyMatches(
  supabase: ReturnType<typeof createAdminSupabase>,
  postId: string,
  authorId: string,
  category: string,
  title: string,
): Promise<void> {
  const { data: existingNotifs } = await supabase
    .from('notifications')
    .select('user_id')
    .eq('post_id', postId)

  const alreadyNotified = new Set((existingNotifs ?? []).map((n) => n.user_id))

  const { data: matches } = await supabase
    .from('posts')
    .select('id, user_id, title')
    .eq('type', 'lost')
    .eq('category', category)
    .eq('status', 'active')
    .neq('user_id', authorId)
    .limit(10)

  if (!matches?.length) return

  const filtered = matches.filter((lost) => !alreadyNotified.has(lost.user_id))
  if (!filtered.length) return

  const notifications = filtered.map((lost) => ({
    user_id: lost.user_id,
    message: `A found "${title}" was posted in ${category} — it might be your "${lost.title}"!`,
    type: 'match',
    claim_id: null,
    post_id: postId,
  }))

  await supabase.from('notifications').insert(notifications)
}
