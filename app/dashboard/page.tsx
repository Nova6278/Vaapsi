'use client'

import { useEffect, useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import Link from 'next/link'
import RefreshButton from './RefreshButton'
import Image from 'next/image'

const CATEGORIES = [
  'All',
  'Electronics',
  'ID Card / Documents',
  'Keys',
  'Wallet / Purse',
  'Clothing',
  'Bag / Backpack',
  'Water Bottle',
  'Eyewear',
  'Jewelry / Watch',
  'Books / Stationery',
  'Other',
]

interface Post {
  id: string
  title: string
  type: string
  category: string
  location: string
  description: string
  photo_url: string | null
  created_at: string
  status: string
}

export default function Dashboard() {
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedType, setSelectedType] = useState<'all' | 'lost' | 'found'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestion, setSuggestion] = useState('')
  const [suggestionSent, setSuggestionSent] = useState(false)
  const [suggestionLoading, setSuggestionLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const fetchPosts = async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
    const rawPosts = (data as Post[]) ?? []

    // generate signed URLs for all post images
    const withSigned = await Promise.all(rawPosts.map(async (p) => {
      if (!p.photo_url) return p
      const { data: signed } = await supabase.storage
        .from('post-images')
        .createSignedUrl(p.photo_url, 3600)
      return { ...p, photo_url: signed?.signedUrl ?? null }
    }))

    setPosts(withSigned)
    setLoading(false)
  }

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { window.location.href = '/login'; return }
      setCurrentUserId(user.id)
      fetchPosts()
    }
    checkAuth()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtered = posts.filter(p => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false
    if (selectedType !== 'all' && p.type !== selectedType) return false
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      if (
        !p.title.toLowerCase().includes(q) &&
        !p.description?.toLowerCase().includes(q) &&
        !p.location?.toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const total = filtered.length
  const lost = filtered.filter(p => p.type === 'lost').length
  const found = filtered.filter(p => p.type === 'found').length

  if (loading) return (
    <main className="relative min-h-screen" style={{ background: '#050a15' }}>
      <div className="px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Stats skeleton */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-4 animate-pulse"
                style={{ background: 'rgba(13,18,37,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-3 w-20 rounded mb-2" style={{ background: '#111830' }} />
                <div className="h-8 w-10 rounded mb-1" style={{ background: '#111830' }} />
                <div className="h-2 w-24 rounded" style={{ background: '#111830' }} />
              </div>
            ))}
          </div>
          {/* Header skeleton */}
          <div className="mb-5">
            <div className="h-6 w-36 rounded mb-2 animate-pulse" style={{ background: '#111830' }} />
            <div className="h-3 w-48 rounded mb-4 animate-pulse" style={{ background: '#111830' }} />
            <div className="flex gap-2 mb-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-8 w-16 rounded-lg animate-pulse" style={{ background: '#111830' }} />
              ))}
            </div>
          </div>
          {/* Cards skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-2xl overflow-hidden animate-pulse"
                style={{ background: 'rgba(13,18,37,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-20" style={{ background: '#111830' }} />
                <div className="p-4">
                  <div className="h-4 w-24 rounded mb-2" style={{ background: '#111830' }} />
                  <div className="h-3 w-32 rounded mb-2" style={{ background: '#111830' }} />
                  <div className="h-3 w-full rounded" style={{ background: '#111830' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  )

  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: '#050a15' }}>

      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] right-[-15%] w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #185FA5 0%, transparent 70%)' }} />
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{ background: 'radial-gradient(circle, #138808 0%, transparent 70%)' }} />
        <div className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        <div className="absolute inset-0 opacity-[0.01]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }} />
      </div>

      <div className="relative z-10 px-4 py-8">
        <div className="max-w-5xl mx-auto">

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {[
              { label: 'Active Posts', value: total, color: '#f0f2f5', sub: 'live right now' },
              { label: 'Lost Items', value: lost, color: '#f87171', sub: 'waiting to be found' },
              { label: 'Found Items', value: found, color: '#4ade80', sub: 'waiting for owner' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-4"
                style={{
                  background: 'rgba(13,18,37,0.6)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(12px)',
                }}>
                <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#8b92a5' }}>
                  {stat.label}
                </p>
                <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
                <p className="text-xs mt-1" style={{ color: '#4a5068' }}>{stat.sub}</p>
              </div>
            ))}
          </div>

          {/* Header + filters */}
          <div className="mb-5">
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>Recent Posts</h1>
              <RefreshButton />
            </div>
            <p className="text-sm mt-1 mb-4" style={{ color: '#8b92a5' }}>
              Active listings from campus
            </p>

            {/* Search */}
            <div className="relative mb-3">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: '#4a5068' }}>🔍</span>
              <input
                type="text"
                placeholder="Search by title, description, location..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none"
                style={{
                  background: 'rgba(13,18,37,0.8)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#f0f2f5',
                }}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                  style={{ color: '#4a5068' }}>✕</button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex gap-2 mb-3">
              {(['all', 'lost', 'found'] as const).map(t => (
                <button key={t} onClick={() => setSelectedType(t)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={selectedType === t
                    ? t === 'lost'
                      ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                      : t === 'found'
                      ? { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }
                      : { background: '#185FA5', color: '#fff', border: '1px solid #185FA5' }
                    : { background: 'transparent', color: '#4a5068', border: '1px solid rgba(255,255,255,0.06)' }
                  }>
                  {t === 'all' ? '🔖 All' : t === 'lost' ? '🔍 Lost' : '📦 Found'}
                </button>
              ))}
            </div>

            {/* Category filter */}
            <div className="flex gap-2 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all shrink-0"
                  style={selectedCategory === cat
                    ? { background: 'rgba(24,95,165,0.2)', color: '#5b9bd5', border: '1px solid rgba(24,95,165,0.4)' }
                    : { background: 'transparent', color: '#4a5068', border: '1px solid rgba(255,255,255,0.06)' }
                  }>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Empty state */}
          {total === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <p className="text-4xl mb-4">📭</p>
              <p className="font-medium" style={{ color: '#8b92a5' }}>
                {selectedCategory !== 'All' || selectedType !== 'all'
                  ? 'No posts match your filters'
                  : 'No posts yet'}
              </p>
              {selectedCategory !== 'All' || selectedType !== 'all' ? (
                <button onClick={() => { setSelectedCategory('All'); setSelectedType('all'); setSearchQuery('') }}
                  className="mt-4 text-sm" style={{ color: '#185FA5' }}>
                  Clear filters
                </button>
              ) : (
                <Link href="/posts/new">
                  <button className="mt-6 px-5 py-2 rounded-lg text-sm font-semibold text-white"
                    style={{ background: '#185FA5' }}>
                    + New Post
                  </button>
                </Link>
              )}
            </div>
          )}

          {/* Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((post) => (
              <Link key={post.id} href={`/posts/${post.id}`}>
                <div className="group flex flex-col rounded-2xl overflow-hidden h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                  style={{
                    background: 'rgba(13,18,37,0.6)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(12px)',
                  }}>

                  {post.photo_url ? (
                    <div className="relative h-44 overflow-hidden">
                      <Image src={post.photo_url} alt={post.title} fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300" unoptimized />
                      <div className="absolute inset-0"
                        style={{ background: 'linear-gradient(to top, rgba(5,10,21,0.8), transparent)' }} />
                      <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                        style={post.type === 'lost'
                          ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                          : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                        {post.type}
                      </span>
                    </div>
                  ) : (
                    <div className="h-20 flex items-center justify-center"
                      style={{ background: 'rgba(17,24,48,0.8)' }}>
                      <span className="text-3xl">{post.type === 'lost' ? '🔍' : '📦'}</span>
                    </div>
                  )}

                  <div className="flex flex-col flex-1 p-4">
                    {!post.photo_url && (
                      <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mb-3 self-start"
                        style={post.type === 'lost'
                          ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                          : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                        {post.type}
                      </span>
                    )}
                    <h2 className="text-base font-semibold leading-snug" style={{ color: '#f0f2f5' }}>
                      {post.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs" style={{ color: '#8b92a5' }}>📍 {post.location}</p>
                      {post.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full"
                          style={{ background: 'rgba(255,255,255,0.06)', color: '#8b92a5' }}>
                          {post.category}
                        </span>
                      )}
                    </div>
                    {post.description && (
                      <p className="text-xs mt-2 line-clamp-2" style={{ color: '#4a5068' }}>
                        {post.description}
                      </p>
                    )}
                    <div className="mt-auto pt-3 flex items-center justify-between"
                      style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                      <span className="text-xs" style={{ color: '#8b92a5' }}>
                        {new Date(post.created_at).toLocaleString('en-IN', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                        })}
                      </span>
                      <span className="text-[11px] font-medium" style={{ color: '#185FA5' }}>
                        View →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

          {/* Suggestion box */}
          <div className="mt-12 max-w-xl mx-auto">
            <div className="rounded-2xl p-6"
              style={{ background: 'rgba(13,18,37,0.6)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}>
              <h3 className="text-sm font-semibold mb-1" style={{ color: '#f0f2f5' }}>💡 Suggest a feature</h3>
              <p className="text-xs mb-4" style={{ color: '#4a5068' }}>What would make Vaapsi better for you?</p>
              {suggestionSent ? (
                <p className="text-sm text-center py-4" style={{ color: '#4ade80' }}>✓ Thanks! We read every suggestion.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <textarea
                    rows={3}
                    placeholder="e.g. Add a map view, email alerts, dark mode..."
                    value={suggestion}
                    onChange={e => setSuggestion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{
                      background: 'rgba(17,24,48,0.8)',
                      border: '1px solid rgba(255,255,255,0.08)',
                      color: '#f0f2f5',
                    }}
                  />
                  <button
                    disabled={!suggestion.trim() || suggestionLoading}
                    onClick={async () => {
                      if (!suggestion.trim()) return
                      setSuggestionLoading(true)
                      await supabase.from('suggestions').insert({
                        user_id: currentUserId,
                        suggestion: suggestion.trim(),
                      })
                      setSuggestionSent(true)
                      setSuggestionLoading(false)
                    }}
                    className="self-end px-4 py-2 rounded-lg text-xs font-semibold transition-opacity disabled:opacity-40"
                    style={{ background: '#185FA5', color: '#fff' }}>
                    {suggestionLoading ? 'Sending...' : 'Send →'}
                  </button>
                </div>
              )}
            </div>
          </div>

      </div>
    </main>
  )
}