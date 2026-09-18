'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createBrowserClient } from '@supabase/ssr'

const REASONS = [
  'Spam or fake',
  'Extortion attempt',
  'Inappropriate content',
  'Already resolved',
  'Other',
]

export default function ReportButton({ postId }: { postId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('Spam or fake')
  const [submitted, setSubmitted] = useState(false)
  const [alreadyReported, setAlreadyReported] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (submitted || loading) return
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    // Prevent duplicate reports from the same reporter on the same post
    const { data: existing } = await supabase
      .from('reports')
      .select('id')
      .eq('post_id', postId)
      .eq('reporter_id', user.id)
      .maybeSingle()

    if (existing) {
      setAlreadyReported(true)
      setSubmitted(true)
      setLoading(false)
      return
    }

    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    const { error: insertError } = await supabase.from('reports').insert({
      post_id: postId,
      reporter_id: user.id,
      reported_user_id: post?.user_id,
      reason,
    })
    // 23505 = unique violation from the (post_id, reporter_id) constraint
    // (audit M10) — a double-submit race got past the pre-check above.
    if (insertError?.code === '23505') setAlreadyReported(true)
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <span className="text-xs" style={{ color: '#4a5068' }}>
        {alreadyReported ? '✓ Already reported' : '✓ Reported'}
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs transition-opacity hover:opacity-70"
        style={{ color: '#4a5068' }}
      >
        Report post
      </button>
    )
  }

  return (
    <div className="rounded-xl p-3 flex flex-col gap-2"
      style={{ background: 'rgba(13,18,37,0.9)', border: '1px solid rgba(255,255,255,0.08)' }}>
      <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: '#4a5068' }}>
        Reason
      </p>
      <select
        value={reason}
        onChange={e => setReason(e.target.value)}
        className="w-full rounded-lg px-2 py-1.5 text-xs outline-none"
        style={{
          background: '#080c18',
          color: '#f0f2f5',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {REASONS.map(r => (
          <option key={r} value={r}>{r}</option>
        ))}
      </select>

      {reason === 'Extortion attempt' && (
        <p className="text-[10px] leading-relaxed" style={{ color: '#fbbf24' }}>
          ⚠️ This is serious. You can also contact KIIT security directly.
        </p>
      )}

      <div className="flex items-center gap-3 mt-1">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="px-3 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-90 disabled:opacity-40"
          style={{ background: '#185FA5', color: '#fff' }}
        >
          {loading ? 'Submitting...' : 'Submit report'}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="text-xs transition-opacity hover:opacity-70"
          style={{ color: '#4a5068' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
