'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'
import { logError } from '@/lib/logger'
import { sanitize, LIMITS } from '@/lib/sanitize'
import { isValidImage, MAX_PROOF_IMAGE } from '@/lib/validate-image'

export default function ClaimPost() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [answer, setAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [post, setPost] = useState<{ title: string; location: string; type: string; verification_question: string; user_id: string } | null>(null)
  const [isOwnPost, setIsOwnPost] = useState(false)
  const [alreadyClaimed, setAlreadyClaimed] = useState(false)
  const [proofFile, setProofFile] = useState<File | null>(null)
  const [proofPreview, setProofPreview] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    Promise.all([
      supabase.from('posts').select('title, location, type, verification_question, user_id').eq('id', postId).single(),
      supabase.auth.getUser(),
    ]).then(async ([{ data: postData }, { data: { user } }]) => {
      if (!user) { window.location.href = '/login'; return }
      setPost(postData)
      if (postData && user && postData.user_id === user.id) {
        setIsOwnPost(true)
        return
      }
      if (user) {
        const { data: existing } = await supabase
          .from('claims')
          .select('id')
          .eq('post_id', postId)
          .eq('claimant_id', user.id)
          .limit(1)
        if (existing && existing.length > 0) {
          setAlreadyClaimed(true)
        }
      }
    })
  }, [postId])

  const handleProofSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > MAX_PROOF_IMAGE) {
      setError('Image must be under 5MB.')
      return
    }

    const valid = await isValidImage(file)
    if (!valid) {
      setError('Invalid image file. Only JPG, PNG, WebP, and GIF allowed.')
      return
    }

    setError('')
    setProofFile(file)
    setProofPreview(URL.createObjectURL(file))
  }

  const removeProof = () => {
    setProofFile(null)
    if (proofPreview) URL.revokeObjectURL(proofPreview)
    setProofPreview(null)
  }

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const cleanedAnswer = sanitize(answer, LIMITS.claim_answer)

    if (!cleanedAnswer) {
      setError('Answer cannot be empty.')
      setLoading(false)
      return
    }

    // Claim creation is fully server-side now (audit H4/C2): the route
    // enforces auth, ban status, own-post and duplicate guards, and creates
    // the owner's notification itself with a fixed template.
    const res = await fetch('/api/claims/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postId, answer: cleanedAnswer }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setError((data as { error?: string }).error ?? 'Failed to submit claim.')
      setLoading(false)
      return
    }

    const { claimId } = (await res.json()) as { claimId: string }

    if (proofFile && claimId) {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      // Extension derived from the VALIDATED mime type, not the filename (audit M5).
      const extByType: Record<string, string> = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
      }
      const ext = extByType[proofFile.type] ?? 'jpg'
      const filePath = `${claimId}/proof.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('claim-proofs')
        .upload(filePath, proofFile, { upsert: false, contentType: proofFile.type })

      if (uploadError) {
        logError('Proof upload failed:', uploadError.message)
      } else {
        await supabase
          .from('claims')
          .update({ proof_image_url: filePath })
          .eq('id', claimId)
      }
    }

    router.push('/dashboard')
  }

  useEffect(() => {
    return () => {
      if (proofPreview) URL.revokeObjectURL(proofPreview)
    }
  }, [proofPreview])

  const isLostPost = post?.type === 'lost'

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="p-6">

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

            {isOwnPost || alreadyClaimed ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">🚫</div>
                <h2 className="text-lg font-bold mb-2" style={{ color: '#f0f2f5' }}>
                  {isOwnPost ? 'This is your post' : 'Already claimed'}
                </h2>
                <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>
                  {isOwnPost
                    ? 'You cannot submit a claim on your own post.'
                    : 'You have already submitted a claim on this post. Wait for the poster to review it.'}
                </p>
                <a href={`/posts/${postId}`}
                  className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: '#185FA5' }}>
                  ← Back to post
                </a>
              </div>
            ) : (
              <>
                <h1 className="text-base font-semibold mb-1" style={{ color: '#f0f2f5' }}>
                  {isLostPost ? 'Submit Response' : 'Submit Claim'}
                </h1>
                <p className="text-sm mb-5" style={{ color: '#8b92a5' }}>
                  {isLostPost
                    ? 'Found this item? Describe where you found it and optionally attach a photo as proof.'
                    : 'Answer verification question to prove item belongs to you.'}
                </p>

                {post?.verification_question && !isLostPost && (
                  <div className="rounded-xl p-4 mb-5" style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a5068' }}>
                      Verification question
                    </p>
                    <p className="text-sm" style={{ color: '#f0f2f5' }}>{post.verification_question}</p>
                  </div>
                )}

                {error && (
                  <div className="rounded-xl px-4 py-3 mb-4 text-sm" style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
                    {error}
                  </div>
                )}

                <form onSubmit={handleClaim} className="flex flex-col gap-4">
                  <div>
                    <textarea
                      aria-label={isLostPost ? "Description of found item" : "Verification answer"}
                      placeholder={isLostPost ? "Describe where and when you found it..." : "Type your answer here..."}
                      value={answer}
                      onChange={(e) => {
                        if (e.target.value.length <= LIMITS.claim_answer) setAnswer(e.target.value)
                      }}
                      rows={4}
                      required
                      maxLength={LIMITS.claim_answer}
                      className="w-full rounded-xl p-4 text-sm resize-none outline-none transition-colors"
                      style={{
                        background: '#111830',
                        border: '1px solid rgba(255,255,255,0.06)',
                        color: '#f0f2f5',
                      }}
                      onFocus={e => (e.currentTarget.style.border = '1px solid #185FA5')}
                      onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}
                    />
                    <span className="text-xs mt-1 block text-right" style={{ color: '#4a5068' }}>
                      {answer.length}/{LIMITS.claim_answer}
                    </span>
                  </div>

                  {isLostPost && (
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5068' }}>
                        Photo proof <span style={{ color: '#4a5068', fontWeight: 400 }}>(optional)</span>
                      </p>

                      {proofPreview ? (
                        <div className="relative rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
                          {/* Raw <img> is intentional: proofPreview is a transient
                              URL.createObjectURL blob; next/image adds no value for a
                              client-only preview and requires fixed dimensions. */}
                          {/* eslint-disable-next-line @next/next/no-img-element */}
<img
  src={proofPreview}
  alt="Proof preview"
  className="w-full max-h-48 object-cover"
/>
                          <button
                            type="button"
                            onClick={removeProof}
                            className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{ background: 'rgba(0,0,0,0.7)', color: '#f87171' }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label
                          className="flex flex-col items-center justify-center py-6 rounded-xl cursor-pointer transition-opacity hover:opacity-80"
                          style={{ background: '#111830', border: '1px dashed rgba(255,255,255,0.1)' }}
                        >
                          <span className="text-2xl mb-1">📷</span>
                          <span className="text-xs" style={{ color: '#8b92a5' }}>
                            Tap to attach photo of found item
                          </span>
                          <span className="text-[10px] mt-1" style={{ color: '#4a5068' }}>
                            Max 5MB · Only visible to poster
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            aria-label="Upload photo proof"
                            onChange={handleProofSelect}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  )}

                  <button type="submit" disabled={loading}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ background: '#185FA5' }}>
                    {loading ? 'Submitting...' : isLostPost ? 'Submit Response' : 'Submit Claim'}
                  </button>
                </form>

                <a href={`/posts/${postId}`} className="block mt-4 text-center text-xs" style={{ color: '#4a5068' }}>
                  ← Back to post
                </a>
              </>
            )}

          </div>
        </div>
      </div>
    </main>
  )
}