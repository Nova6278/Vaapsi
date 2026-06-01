import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import BannedClient from './BannedClient'

export default async function BannedPage() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: userData } = await supabase
    .from('users')
    .select('is_banned')
    .eq('id', user.id)
    .single()

  if (!userData?.is_banned) redirect('/dashboard')

  return <BannedClient />
}