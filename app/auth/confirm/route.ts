import { NextRequest, NextResponse } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase-server'

const KIIT_DOMAIN = '@kiit.ac.in'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  const supabase = await createServerSupabase()

  // Server-side enforcement: only @kiit.ac.in emails may hold a session.
  // Client-side signup check is bypassable, so re-validate at the callback.
  const enforceDomain = async (): Promise<NextResponse | null> => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email && !user.email.endsWith(KIIT_DOMAIN)) {
      await supabase.auth.signOut()
      return NextResponse.redirect(new URL('/login?error=invalid_domain', request.url))
    }
    return null
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const domainError = await enforceDomain()
      if (domainError) return domainError
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as EmailOtpType,
    })
    if (!error) {
      const domainError = await enforceDomain()
      if (domainError) return domainError
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=invalid_link', request.url))
}