'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createNotificationClient } from '@/lib/notifications-client'

export type AdminSuggestion = {
  id: string
  suggestion: string
  created_at: string
  user_id: string
  name: string | null
  email: string | null
  roll: string | null
  admin_reply: string | null
  status: string | null
}

function SuggestionCard({ s, onResolved }: { s: AdminSuggestion; onResolved: () => void }) {
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const resolved = s.status === 'resolved'

  async function submit() {
    setError('')
    if (!reply.trim()) return
    setSaving(true)
    const res = await fetch('/api/admin/suggestion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ suggestionId: s.id, reply: reply.trim() }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setSaving(false)
      setError(data.error ?? 'Could not save reply.')
      return
    }
    const data = await res.json()
    const preview = data.reply.length > 100 ? `${data.reply.slice(0, 100)}…` : data.reply
    await createNotificationClient({
      userId: data.suggestorId,
      message: `Your suggestion was marked resolved. Admin reply: ${preview}`,
    })
    setSaving(false)
    onResolved()
  }

  const identity = s.name
    ? `${s.name}${s.roll ? ` (${s.roll})` : ''}${s.email ? ` · ${s.email}` : ''}`
    : s.email ?? 'Unknown user'

  return (
    <div className="rounded-xl p-4" style={{
      background: resolved ? '#0a0e1c' : '#0d1225',
      border: '1px solid rgba(255,255,255,0.06)',
      opacity: resolved ? 0.75 : 1,
    }}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm flex-1" style={{ color: '#f0f2f5' }}>{s.suggestion}</p>
        {resolved && (
          <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded-full shrink-0"
            style={{ background: 'rgba(24,95,165,0.2)', color: '#5b9bd5' }}>resolved</span>
        )}
      </div>
      <p className="text-xs mt-1" style={{ color: '#4a5068' }}>
        Suggested by {identity} · {new Date(s.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
      </p>

      {resolved ? (
        s.admin_reply && (
          <p className="text-xs mt-2 pt-2" style={{ color: '#8b92a5', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <span style={{ color: '#5b9bd5' }}>Your reply:</span> {s.admin_reply}
          </p>
        )
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          <textarea rows={2} value={reply} onChange={e => setReply(e.target.value)}
            placeholder="Write a reply…" aria-label="Reply to suggestion"
            className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
            style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.08)', color: '#f0f2f5' }} />
          {error && <p className="text-xs" style={{ color: '#f87171' }}>{error}</p>}
          <button type="button" onClick={submit} disabled={!reply.trim() || saving}
            className="self-end px-4 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
            style={{ background: '#185FA5', color: '#fff' }}>
            {saving ? 'Saving…' : 'Mark Resolved & Reply'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function SuggestionsAdmin({ suggestions }: { suggestions: AdminSuggestion[] }) {
  const router = useRouter()
  // Open suggestions first, resolved ones greyed below.
  const sorted = [...suggestions].sort((a, b) => {
    const ar = a.status === 'resolved' ? 1 : 0
    const br = b.status === 'resolved' ? 1 : 0
    return ar - br
  })

  return (
    <div className="mb-8">
      <h2 className="text-sm font-semibold uppercase tracking-widest mb-3" style={{ color: '#5b9bd5' }}>
        💡 Feature suggestions ({suggestions.length})
      </h2>
      {suggestions.length === 0 ? (
        <p className="text-xs" style={{ color: '#4a5068' }}>No suggestions yet.</p>
      ) : (
        <div className="flex flex-col gap-2">
          {sorted.map(s => (
            <SuggestionCard key={s.id} s={s} onResolved={() => router.refresh()} />
          ))}
        </div>
      )}
    </div>
  )
}
