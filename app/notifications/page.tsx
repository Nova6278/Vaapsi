import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NotificationsPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
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

  const isConfirmed = (msg: string) => msg.includes('confirmed')
  const isRejected = (msg: string) => msg.includes('rejected')

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

            return (
              <div key={n.id} className="rounded-2xl p-5"
                style={{
                  background: '#0d1225',
                  border: `1px solid ${!n.is_read ? '#185FA5' : 'rgba(255,255,255,0.06)'}`,
                }}>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    {/* dot for unread */}
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: '#185FA5' }} />
                    )}
                    {/* type icon */}
                    <span className="text-base">
                      {confirmed ? '🎉' : rejected ? '❌' : '🔔'}
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

                {n.claim_id && (
                  <div className="mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <Link href="/my-posts"
                      className="text-xs font-medium" style={{ color: '#185FA5' }}>
                      View my posts →
                    </Link>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}