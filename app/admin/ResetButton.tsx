'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetButton() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleReset = async () => {
    if (!confirm('This will delete ALL posts, claims, handoffs, notifications, reports, and suggestions. Users are kept. Cannot be undone. Continue?')) return
    if (!confirm('Are you absolutely sure? This is irreversible.')) return

    setLoading(true)
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        alert(data.error ?? 'Reset failed')
        return
      }
      router.refresh()
    } catch {
      alert('Network error — try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleReset}
      disabled={loading}
      className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-80 disabled:opacity-40"
      style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}
    >
      {loading ? 'Resetting...' : '🗑 Reset all data'}
    </button>
  )
}