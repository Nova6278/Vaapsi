'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'

export default function ReportButton({ postId }: { postId: string }) {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleReport = async () => {
    if (submitted) return
    setLoading(true)
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login'; return }

    const { data: post } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single()

    await supabase.from('reports').insert({
      post_id: postId,
      reporter_id: user.id,
      reported_user_id: post?.user_id,
    })
    setSubmitted(true)
    setLoading(false)
  }

  return (
    <button
      onClick={handleReport}
      disabled={loading || submitted}
      className="text-xs transition-opacity hover:opacity-70 disabled:opacity-40"
      style={{ color: '#4a5068' }}>
      {submitted ? '✓ Reported' : loading ? 'Reporting...' : 'Report post'}
    </button>
  )
}