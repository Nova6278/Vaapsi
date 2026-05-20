import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NotificationsPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*, claims(post_id)')
    .order('created_at', { ascending: false })

  if (error) return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="flex items-center justify-center">
      <p style={{ color: '#f87171' }}>Failed to load notifications.</p>
    </main>
  )

  const unreadIds = (notifications ?? []).filter(n => !n.is_read).map(n => n.id)
  if (unreadIds.length > 0) {
    await supabase.from('notifications').update({ is_read: true }).in('id', unreadIds)
  }

  // Collect all post IDs referenced in notifications
  const allPostIds = new Set<string>()
  for (const n of notifications ?? []) {
    if (n.post_id) allPostIds.add(n.post_id)
    if (n.claims?.post_id) allPostIds.add(n.claims.post_id)
  }

  // Check which posts still exist
  const existingPostIds = new Set<string>()
  if (allPostIds.size > 0) {
    const { data: existingPosts } = await supabase
      .from('posts')
      .select('id')
      .in('id', Array.from(allPostIds))
    if (existingPosts) {
      for (const p of existingPosts) existingPostIds.add(p.id)
    }
  }

  // For confirmed notifications, find handoff IDs by post_id
  const confirmedPostIds = (notifications ?? [])
    .filter(n => n.message?.includes('confirmed') && n.claims?.post_id)
    .map(n => n.claims.post_id)

  const handoffMap: Record<string, string> = {}
  if (confirmedPostIds.length > 0) {
    const { data: handoffs } = await supabase
      .from('handoffs')
      .select('id, post_id')
      .in('post_id', confirmedPostIds)
    if (handoffs) {
      for (const h of handoffs) {
        handoffMap[h.post_id] = h.id
      }
    }
  }

  const isConfirmed = (msg: string) => msg.includes('confirmed')
  const isRejected = (msg: string) => msg.includes('rejected')
  const isMatch = (msg: string) => msg.includes('might be your')

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>Notifications</h1>
          <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>
            {notifications?.length ?? 0} total
          </p>
        </div>

        {(!notifications || notifications.length === 0) && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">🔔</p>
            <p style={{ color: '#8b92a5' }}>No notifications yet.</p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {notifications?.map(n => {
            const confirmed = isConfirmed(n.message)
            const rejected = isRejected(n.message)
            const match = isMatch(n.message)
            const claimPostId = n.claims?.post_id
            const handoffId = claimPostId ? handoffMap[claimPostId] : null

            // Check if referenced post still exists
            const postExists = n.post_id ? existingPostIds.has(n.post_id) : false
            const claimPostExists = claimPostId ? existingPostIds.has(claimPostId) : false

            // Determine link target
            let href: string | null = null
            let linkLabel: string = ''

            if (match && n.post_id && postExists) {
              href = `/posts/${n.post_id}`
              linkLabel = 'View found item →'
            } else if (confirmed && handoffId) {
              href = `/handoff/${handoffId}`
              linkLabel = 'Go to handoff →'
            } else if (n.message?.includes('claimed your post') && claimPostId && claimPostExists) {
              href = `/my-posts/${claimPostId}`
              linkLabel = 'Review claims →'
            } else if (claimPostId && claimPostExists) {
              href = `/posts/${claimPostId}`
              linkLabel = 'View post →'
            }

            // Show "item no longer available" for dead links
            const postDeleted = (n.post_id && !postExists) || (claimPostId && !claimPostExists)

            const card = (
              <div className="rounded-2xl p-5"
                style={{
                  background: '#0d1225',
                  border: `1px solid ${!n.is_read ? '#185FA5' : 'rgba(255,255,255,0.06)'}`,
                }}>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: '#185FA5' }} />
                    )}
                    <span className="text-base">
                      {match ? '🔍' : confirmed ? '🎉' : rejected ? '❌' : '🔔'}
                    </span>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#4a5068' }}>
                    {new Date(n.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                    })}
                  </span>
                </div>

                <p className="text-sm mt-3 leading-relaxed" style={{ color: '#f0f2f5' }}>
                  {n.message}
                </p>

                {postDeleted && !href && (
                  <p className="text-xs mt-3" style={{ color: '#4a5068' }}>
                    This item is no longer available.
                  </p>
                )}

                {href && (
                  <p className="text-xs mt-3 font-medium" style={{ color: '#185FA5' }}>
                    {linkLabel}
                  </p>
                )}
              </div>
            )

            return href ? (
              <Link key={n.id} href={href}>{card}</Link>
            ) : (
              <div key={n.id}>{card}</div>
            )
          })}
        </div>
      </div>
    </main>
  )
}