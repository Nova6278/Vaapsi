import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 2 queries instead of 8
  const [{ data: posts }, { data: claims }] = await Promise.all([
    supabase.from('posts').select('type, status').eq('user_id', user.id),
    supabase.from('claims').select('status').eq('claimant_id', user.id),
  ])

  const postList = posts ?? []
  const claimList = claims ?? []

  const totalPosts = postList.length
  const lostPosts = postList.filter(p => p.type === 'lost').length
  const foundPosts = postList.filter(p => p.type === 'found').length
  const resolvedPosts = postList.filter(p => p.status === 'resolved').length

  const totalClaims = claimList.length
  const confirmedClaims = claimList.filter(c => c.status === 'confirmed').length
  const rejectedClaims = claimList.filter(c => c.status === 'rejected').length
  const pendingClaims = claimList.filter(c => c.status === 'pending').length

  const memberSince = new Date(user.created_at).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  const statCard = (label: string, value: number, color: string) => (
    <div className="rounded-xl p-4 text-center"
      style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] font-semibold uppercase tracking-widest mt-1" style={{ color: '#4a5068' }}>
        {label}
      </p>
    </div>
  )

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        <div className="rounded-2xl p-6 mb-6"
          style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold"
              style={{ background: '#185FA5', color: '#fff' }}>
              {user.email?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#f0f2f5' }}>{user.email}</h1>
              <p className="text-xs mt-1" style={{ color: '#8b92a5' }}>
                Member since {memberSince}
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4a5068' }}>
            Your posts
          </p>
          <div className="grid grid-cols-3 gap-3">
            {statCard('Total', totalPosts, '#f0f2f5')}
            {statCard('Lost', lostPosts, '#f87171')}
            {statCard('Found', foundPosts, '#4ade80')}
          </div>
          <div className="grid grid-cols-1 gap-3 mt-3">
            {statCard('Items returned', resolvedPosts, '#185FA5')}
          </div>
        </div>

        <div className="mb-6">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4a5068' }}>
            Your claims
          </p>
          <div className="grid grid-cols-2 gap-3">
            {statCard('Total', totalClaims, '#f0f2f5')}
            {statCard('Confirmed', confirmedClaims, '#4ade80')}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {statCard('Rejected', rejectedClaims, '#f87171')}
            {statCard('Pending', pendingClaims, '#8b92a5')}
          </div>
        </div>

        <div className="rounded-2xl p-5"
          style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4a5068' }}>
            Quick links
          </p>
          <div className="flex flex-col gap-2">
            <Link href="/my-posts" className="text-sm py-2 px-3 rounded-lg transition-opacity hover:opacity-80"
              style={{ color: '#5b9bd5', background: 'rgba(24,95,165,0.1)' }}>
              My Posts →
            </Link>
            <Link href="/my-claims" className="text-sm py-2 px-3 rounded-lg transition-opacity hover:opacity-80"
              style={{ color: '#5b9bd5', background: 'rgba(24,95,165,0.1)' }}>
              My Claims →
            </Link>
            <Link href="/handoffs" className="text-sm py-2 px-3 rounded-lg transition-opacity hover:opacity-80"
              style={{ color: '#5b9bd5', background: 'rgba(24,95,165,0.1)' }}>
              Handoffs →
            </Link>
          </div>
        </div>

        <Link href="/dashboard" className="block mt-6 text-center text-xs" style={{ color: '#4a5068' }}>
          ← Back to dashboard
        </Link>
      </div>
    </main>
  )
}