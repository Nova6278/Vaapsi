'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'
import { createNotificationClient } from '@/lib/notifications-client'

export default function ClaimPost() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [post, setPost] = useState<{ title: string; location: string; type: string; verification_question: string; user_id: string } | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    supabase.from('posts').select('title, location, type, verification_question, user_id').eq('id', postId).single()
      .then(({ data }) => setPost(data))
  }, [postId])

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in to claim.'); setLoading(false); return }

    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert({ post_id: postId, claimant_id: user.id, answer, status: 'pending' })
      .select()
      .single()

    if (claimError) { setError(claimError.message); setLoading(false); return }

    if (post) {
      await createNotificationClient({
        userId: post.user_id,
        message: `Someone claimed your post: ${post.title}`,
        claimId: claim.id,
      })
    }

    router.push('/dashboard')
  }

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-6">

            {/* Context header */}
            {post && (
              <div className="mb-6 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={post.type === 'lost'
                    ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                    : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                  {post.type}
                </span>
                <h2 className="text-lg font-bold mt-3" style={{ color: '#f0f2f5' }}>{post.title}</h2>
                <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>📍 {post.location}</p>
              </div>
            )}

            {/* Form heading */}
            <h1 className="text-base font-semibold mb-1" style={{ color: '#f0f2f5' }}>Submit Claim</h1>
            <p className="text-sm mb-5" style={{ color: '#8b92a5' }}>
              Answer verification question to prove item belongs to you.
            </p>

            {/* Verification question */}
            {post?.verification_question && (
              <div className="rounded-xl p-4 mb-5" style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a5068' }}>
                  Verification question
                </p>
                <p className="text-sm" style={{ color: '#f0f2f5' }}>{post.verification_question}</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
                {error}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleClaim} className="flex flex-col gap-4">
              <textarea
                placeholder="Type your answer here..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={4}
                required
                className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-colors"
                style={{
                  background: '#111830',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#f0f2f5',
                }}
                onFocus={e => (e.currentTarget.style.border = '1px solid #185FA5')}
                onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}
              />
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                style={{ background: '#185FA5' }}>
                {loading ? 'Submitting...' : 'Submit Claim'}
              </button>
            </form>

            {/* Back */}
            <a href={`/posts/${postId}`} className="block mt-4 text-center text-xs" style={{ color: '#4a5068' }}>
              ← Back to post
            </a>

          </div>
        </div>
      </div>
    </main>
  )
}