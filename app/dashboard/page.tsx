import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default async function Dashboard() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: posts } = await supabase
    .from('posts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const total = posts?.length ?? 0
  const lost = posts?.filter(p => p.type === 'lost').length ?? 0
  const found = posts?.filter(p => p.type === 'found').length ?? 0

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-5xl mx-auto">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          {[
            { label: 'Active Posts', value: total, color: '#f0f2f5', sub: 'live right now' },
            { label: 'Lost Items', value: lost, color: '#f87171', sub: 'waiting to be found' },
            { label: 'Found Items', value: found, color: '#4ade80', sub: 'waiting for owner' },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-4"
              style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
              <p className="text-xs uppercase tracking-wider mb-1" style={{ color: '#8b92a5' }}>
                {stat.label}
              </p>
              <p className="text-3xl font-bold" style={{ color: stat.color }}>{stat.value}</p>
              <p className="text-xs mt-1" style={{ color: '#4a5068' }}>{stat.sub}</p>
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="mb-5">
          <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>Recent Posts</h1>
          <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>
            Active listings from KIIT campus
          </p>
        </div>

        {/* Empty state */}
        {total === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">📭</p>
            <p className="font-medium" style={{ color: '#8b92a5' }}>No posts yet</p>
            <Link href="/posts/new">
              <button className="mt-6 px-5 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#185FA5' }}>
                + New Post
              </button>
            </Link>
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts?.map((post) => (
            <Link key={post.id} href={`/posts/${post.id}`}>
              <div className="group flex flex-col rounded-2xl overflow-hidden h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
                style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>

                {post.photo_url ? (
                  <div className="relative h-44 overflow-hidden">
                    <img src={post.photo_url} alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className="absolute inset-0"
                      style={{ background: 'linear-gradient(to top, #0d1225cc, transparent)' }} />
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={post.type === 'lost'
                        ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                        : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                      {post.type}
                    </span>
                  </div>
                ) : (
                  <div className="h-20 flex items-center justify-center"
                    style={{ background: '#111830' }}>
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
                  <p className="text-xs mt-1" style={{ color: '#8b92a5' }}>📍 {post.location}</p>
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
    </main>
  )
}