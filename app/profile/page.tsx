import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './LogoutButton'
import ProfileEditor from './ProfileEditor'

// Reflect profile edits and suggestion replies immediately.
export const dynamic = 'force-dynamic'

type MySuggestion = {
  id: string
  suggestion: string
  created_at: string
  status?: string | null
  admin_reply?: string | null
}

export default async function ProfilePage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: posts }, { data: claims }, { data: mySuggestions }] = await Promise.all([
    supabase.from('posts').select('type, status').eq('user_id', user.id),
    supabase.from('claims').select('status').eq('claimant_id', user.id),
    supabase.from('suggestions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ])

  const postList = posts ?? []
  const claimList = claims ?? []
  const suggestionList: MySuggestion[] = mySuggestions ?? []

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

  const displayName = user.user_metadata?.name || user.email
  const avatarUrl: string | null = user.user_metadata?.avatar_url ?? null

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
            <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xl font-bold"
              style={{ background: '#185FA5', color: '#fff' }}>
              {avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={avatarUrl} alt="Profile photo" className="w-full h-full object-cover" />
                : displayName?.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-lg font-bold" style={{ color: '#f0f2f5' }}>{displayName}</h1>
              <p className="text-xs mt-1" style={{ color: '#8b92a5' }}>
                Member since {memberSince}
              </p>
            </div>
          </div>
        </div>

        <ProfileEditor
          email={user.email!}
          initialName={user.user_metadata?.name ?? ''}
          initialAvatarUrl={avatarUrl}
        />

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

        <div className="rounded-2xl p-5 mb-6"
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

        {suggestionList.length > 0 && (
          <div className="rounded-2xl p-5 mb-6"
            style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4a5068' }}>
              My suggestions
            </p>
            <div className="flex flex-col gap-2">
              {suggestionList.map(s => {
                const resolved = s.status === 'resolved'
                return (
                  <div key={s.id} className="rounded-xl p-3"
                    style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm flex-1" style={{ color: '#f0f2f5' }}>{s.suggestion}</p>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0"
                        style={resolved
                          ? { background: 'rgba(24,95,165,0.2)', color: '#5b9bd5' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#8b92a5' }}>
                        {resolved ? 'resolved' : 'open'}
                      </span>
                    </div>
                    {resolved && s.admin_reply && (
                      <p className="text-xs mt-2 pt-2" style={{ color: '#8b92a5', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        <span style={{ color: '#5b9bd5' }}>Admin reply:</span> {s.admin_reply}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="rounded-2xl p-5 mb-6"
          style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#4a5068' }}>
            Account
          </p>
          <LogoutButton />
        </div>

        <Link href="/dashboard" className="block mt-6 text-center text-xs" style={{ color: '#4a5068' }}>
          ← Back to dashboard
        </Link>
      </div>
    </main>
  )
}