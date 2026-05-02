import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'

export default async function PostDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const { data: post, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .single()

  if (!post) return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="flex items-center justify-center">
      <p style={{ color: '#8b92a5' }}>Post not found. {error?.message}</p>
    </main>
  )

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        {/* Card */}
        <div className="rounded-2xl overflow-hidden" style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>

          {/* Image */}
          {post.photo_url && (
            <div className="relative h-64 overflow-hidden">
              <img src={post.photo_url} alt={post.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, #0d1225cc, transparent)' }} />
            </div>
          )}

          <div className="p-6">
            {/* Badge + date */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={post.type === 'lost'
                  ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                  : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                {post.type}
              </span>
              <span className="text-sm" style={{ color: '#8b92a5' }}>
                {new Date(post.created_at).toLocaleString('en-IN', {
                  day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                })}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl font-bold leading-snug" style={{ color: '#f0f2f5' }}>
              {post.title}
            </h1>

            {/* Meta */}
            <div className="flex items-center gap-3 mt-2">
              <p className="text-sm" style={{ color: '#8b92a5' }}>📍 {post.location}</p>
              {post.category && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.06)', color: '#8b92a5' }}>
                  {post.category}
                </span>
              )}
            </div>

            {/* Description */}
            {post.description && (
              <p className="mt-4 text-sm leading-relaxed" style={{ color: '#8b92a5' }}>
                {post.description}
              </p>
            )}

            {/* Verification question */}
            {post.verification_question && (
              <div className="mt-6 rounded-xl p-4" style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5068' }}>
                  To claim, answer this:
                </p>
                <p className="text-sm" style={{ color: '#f0f2f5' }}>
                  {post.verification_question}
                </p>
              </div>
            )}

            {/* CTA */}
            <Link href={`/posts/${id}/claim`}>
              <button className="mt-6 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: '#185FA5' }}>
                Claim This Item
              </button>
            </Link>

            {/* Back */}
            <Link href="/dashboard" className="block mt-4 text-center text-xs"
              style={{ color: '#4a5068' }}>
              ← Back to dashboard
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}