import { createServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function NotificationsPage() {
  const supabase = await createServerSupabase()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Fetch all notifications for this user, newest first
  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return (
      <main className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Notifications</h1>
        <p className="text-red-500">Failed to load notifications.</p>
      </main>
    )
  }

  // Mark all unread ones as read (fire and forget)
  const unreadIds = (notifications ?? [])
    .filter(n => !n.is_read)
    .map(n => n.id)

  if (unreadIds.length > 0) {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .in('id', unreadIds)
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Notifications</h1>

      {(!notifications || notifications.length === 0) ? (
        <p className="text-gray-500">You have no notifications yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {notifications.map(n => (
            <li
              key={n.id}
              className={`border rounded-lg p-4 ${
                !n.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'
              }`}
            >
              <p className="text-sm">{n.message}</p>
              <p className="text-xs text-gray-500 mt-1">
                {new Date(n.created_at).toLocaleString()}
              </p>
              {n.claim_id && (
                <Link
                  href="/my-posts"
                  className="text-xs text-blue-600 underline mt-2 inline-block"
                >
                  View my posts →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}