'use client'

import { useState } from 'react'
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

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to claim.')
      setLoading(false)
      return
    }

    // Insert the claim and get the new row back
    const { data: claim, error: claimError } = await supabase
      .from('claims')
      .insert({
        post_id: postId,
        claimant_id: user.id,
        answer,
        status: 'pending',
      })
      .select()
      .single()

    if (claimError) {
      setError(claimError.message)
      setLoading(false)
      return
    }

    // Fetch the post to get owner + title
    const { data: post } = await supabase
      .from('posts')
      .select('user_id, title')
      .eq('id', postId)
      .single()

    // Notify the post owner (non-blocking: don't fail the claim if this fails)
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
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Claim This Item</h1>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <form onSubmit={handleClaim} className="flex flex-col gap-4">
        <textarea
          placeholder="Your answer to the verification question"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          rows={4}
          required
          className="border rounded-lg p-2"
        />
        <button type="submit" disabled={loading}
          className="bg-black text-white py-2 rounded-lg font-semibold">
          {loading ? 'Submitting...' : 'Submit Claim'}
        </button>
      </form>
    </main>
  )
}