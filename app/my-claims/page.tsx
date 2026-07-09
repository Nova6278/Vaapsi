'use client'

import { useEffect, useMemo, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ClaimWithPost {
  id: string
  post_id: string
  answer: string
  status: string
  created_at: string
  proof_image_url: string | null
  posts: {
    title: string
    type: string
    location: string
  }
}

export default function MyClaims() {
  const router = useRouter()
  const [claims, setClaims] = useState<ClaimWithPost[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(
    () => createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    ),
    []
  )

  useEffect(() => {
    const fetchClaims = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data } = await supabase
        .from('claims')
        .select('id, post_id, answer, status, created_at, proof_image_url, posts(title, type, location)')
        .eq('claimant_id', user.id)
        .order('created_at', { ascending: false })

      setClaims((data as unknown as ClaimWithPost[]) ?? [])
      setLoading(false)
    }
    fetchClaims()
  }, [supabase, router])

  if (loading) return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <div className="h-6 w-28 rounded animate-pulse" style={{ background: '#111830' }} />
          <div className="h-3 w-40 rounded mt-2 animate-pulse" style={{ background: '#111830' }} />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse"
              style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-14 rounded-full" style={{ background: '#111830' }} />
                <div className="h-5 w-20 rounded-full" style={{ background: '#111830' }} />
              </div>
              <div className="h-5 w-36 rounded mb-1" style={{ background: '#111830' }} />
              <div className="h-3 w-28 rounded mt-2" style={{ background: '#111830' }} />
              <div className="pt-3 mt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-3 w-16 rounded mb-2" style={{ background: '#111830' }} />
                <div className="h-3 w-full rounded" style={{ background: '#111830' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>My Claims</h1>
          <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>
            {claims.length} claim{claims.length !== 1 ? 's' : ''} submitted
          </p>
        </div>

        {claims.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">📭</p>
            <p style={{ color: '#8b92a5' }}>No claims yet.</p>
            <Link href="/dashboard" className="mt-4 text-sm" style={{ color: '#185FA5' }}>
              Browse items →
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {claims.map((claim) => (
            <Link key={claim.id} href={`/posts/${claim.post_id}`}>
              <div className="rounded-2xl p-5 transition-opacity hover:opacity-90 cursor-pointer"
                style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={claim.posts.type === 'lost'
                        ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                        : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                      {claim.posts.type}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={
                        claim.status === 'confirmed'
                          ? { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }
                          : claim.status === 'rejected'
                          ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                          : { background: 'rgba(255,255,255,0.06)', color: '#8b92a5', border: '1px solid rgba(255,255,255,0.1)' }
                      }>
                      {claim.status}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: '#4a5068' }}>
                    {new Date(claim.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                    })}
                  </span>
                </div>

                <h2 className="text-base font-bold" style={{ color: '#f0f2f5' }}>
                  {claim.posts.title}
                </h2>
                <p className="text-xs mt-1" style={{ color: '#8b92a5' }}>
                  📍 {claim.posts.location}
                </p>

                <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: '#4a5068' }}>
                    Your {claim.posts.type === 'lost' ? 'response' : 'answer'}
                  </p>
                  <p className="text-sm line-clamp-2" style={{ color: '#8b92a5' }}>
                    {claim.answer}
                  </p>
                </div>

                {claim.proof_image_url && (
                  <p className="text-[10px] mt-2" style={{ color: '#4a5068' }}>
                    📷 Photo proof attached
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        <Link href="/dashboard" className="block mt-6 text-center text-xs" style={{ color: '#4a5068' }}>
          ← Back to dashboard
        </Link>
      </div>
    </main>
  )
}