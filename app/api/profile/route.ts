import { NextRequest, NextResponse } from 'next/server'
import { getActiveUser } from '@/lib/auth-server'
import { createAdminSupabase } from '@/lib/supabase-admin'
import { userLimiters, limitUser } from '@/lib/ratelimit'
import { isValidImage } from '@/lib/validate-image'
import { sanitize, containsProfanity } from '@/lib/sanitize'

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const MAX_AVATAR = 2 * 1024 * 1024 // 2MB
const NAME_MAX = 50

// Updates the caller's own display name and/or avatar. Validation happens here
// (trust boundary), then writes go through the admin client for the caller's row only.
export async function POST(req: NextRequest) {
  // Audit C3: also rejects banned accounts, which middleware misses for /api/*.
  const { user, error } = await getActiveUser()
  if (error) return error

  const limited = await limitUser(userLimiters.action, user.id)
  if (limited) return limited

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const rawName = form.get('name')
  const avatar = form.get('avatar')
  const admin = createAdminSupabase()

  const metadata: Record<string, unknown> = { ...user.user_metadata }
  const userRow: Record<string, unknown> = {}

  if (typeof rawName === 'string') {
    const name = sanitize(rawName, NAME_MAX)
    if (!name) return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
    if (containsProfanity(name)) {
      return NextResponse.json({ error: 'Display name contains inappropriate language.' }, { status: 400 })
    }
    metadata.name = name
    userRow.name = name
  }

  if (avatar instanceof File && avatar.size > 0) {
    if (!AVATAR_TYPES.includes(avatar.type)) {
      return NextResponse.json({ error: 'Avatar must be JPG, PNG, or WebP' }, { status: 400 })
    }
    if (avatar.size > MAX_AVATAR) {
      return NextResponse.json({ error: 'Avatar must be under 2MB' }, { status: 400 })
    }
    if (!(await isValidImage(avatar))) {
      return NextResponse.json({ error: 'File is not a valid image' }, { status: 400 })
    }
    const ext = avatar.type === 'image/png' ? 'png' : avatar.type === 'image/webp' ? 'webp' : 'jpg'
    const path = `${user.id}/avatar.${ext}`
    const { error: upErr } = await admin.storage
      .from('avatars')
      .upload(path, avatar, { upsert: true, contentType: avatar.type })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })
    const { data: pub } = admin.storage.from('avatars').getPublicUrl(path)
    // cache-bust so the browser reloads a replaced avatar
    metadata.avatar_url = `${pub.publicUrl}?v=${Date.now()}`
  }

  const { error: metaErr } = await admin.auth.admin.updateUserById(user.id, {
    user_metadata: metadata,
  })
  if (metaErr) return NextResponse.json({ error: metaErr.message }, { status: 500 })

  if (Object.keys(userRow).length > 0) {
    const { error: rowErr } = await admin.from('users').update(userRow).eq('id', user.id)
    if (rowErr) return NextResponse.json({ error: rowErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    name: metadata.name ?? null,
    avatarUrl: metadata.avatar_url ?? null,
  })
}
