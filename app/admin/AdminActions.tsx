'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Props {
  postId: string | null
  reportedUserId: string | null
  userIsBanned: boolean
  userIsWarned: boolean
}

export default function AdminActions({ postId, reportedUserId, userIsBanned, userIsWarned }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const callAction = async (action: 'warn' | 'ban' | 'unban', banReason?: string) => {
    if (!reportedUserId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reportedUserId, banReason }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Action failed')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  const deletePost = async () => {
    if (!postId) return
    if (!confirm('Delete this post? Cannot be undone.')) return
    setLoading(true)
    setError(null)
    try {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error: deleteError } = await supabase.from('posts').delete().eq('id', postId)
      if (deleteError) {
        setError('Delete failed — try again')
        return
      }
      router.refresh()
    } catch {
      setError('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  const issueWarning = async () => {
    if (!confirm('Issue warning to this user?')) return
    await callAction('warn')
  }

  const banUser = async () => {
    const reason = prompt('Enter ban reason:')
    if (!reason) return
    await callAction('ban', reason)
  }

  const unbanUser = async () => {
    if (!confirm('Unban this user?')) return
    await callAction('unban')
  }

  if (loading) return (
    <span className="text-xs px-3 py-1.5 rounded-lg shrink-0" style={{ color: '#4a5068' }}>...</span>
  )

  return (
    <div className="flex flex-col gap-1.5 shrink-0">
      {error && (
        <p className="text-xs text-right" style={{ color: '#f87171' }}>{error}</p>
      )}
      {postId && (
        <button onClick={deletePost}
          className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
          Delete
        </button>
      )}
      {reportedUserId && !userIsBanned && !userIsWarned && (
        <button onClick={issueWarning}
          className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24', border: '1px solid #78350f' }}>
          Warn
        </button>
      )}
      {reportedUserId && !userIsBanned && userIsWarned && (
        <button onClick={banUser}
          className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
          Ban
        </button>
      )}
      {reportedUserId && userIsBanned && (
        <button onClick={unbanUser}
          className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80"
          style={{ background: 'rgba(74,222,128,0.1)', color: '#4ade80', border: '1px solid #14301f' }}>
          Unban
        </button>
      )}
    </div>
  )
}