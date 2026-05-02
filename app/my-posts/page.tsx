import { createServerSupabase } from '@/lib/supabase-server'
import Link from 'next/link'

export default async function MyPosts() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: posts } = await supabase
    .from('posts')
    .select('*, claims(*)')
    .eq('user_id', user?.id ?? '')
    .order('created_at', { ascending: false })

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-2xl mx-auto">

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>My Posts</h1>
          <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>Items you've reported lost or found</p>
        </div>

        {posts?.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-4xl mb-4">📭</p>
            <p style={{ color: '#8b92a5' }}>No posts yet.</p>
            <Link href="/posts/new">
              <button className="mt-6 px-5 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: '#185FA5' }}>
                + New Post
              </button>
            </Link>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {posts?.map((post) => {
            const claimCount = post.claims?.length ?? 0
            const pendingCount = post.claims?.filter((c: { status: string }) => c.status === 'pending').length ?? 0

            return (
              <div key={post.id} className="rounded-2xl p-5"
                style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>

                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                      style={post.type === 'lost'
                        ? { background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }
                        : { background: '#14301f', color: '#4ade80', border: '1px solid #14532d' }}>
                      {post.type}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.06)', color: '#8b92a5' }}>
                      {post.status}
                    </span>
                  </div>
                  <span className="text-xs shrink-0" style={{ color: '#4a5068' }}>
                    {new Date(post.created_at).toLocaleString('en-IN', {
                      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true
                    })}
                  </span>
                </div>

                <h2 className="text-base font-semibold mt-3" style={{ color: '#f0f2f5' }}>
                  {post.title}
                </h2>

                <div className="flex items-center justify-between mt-4 pt-3"
                  style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: '#8b92a5' }}>
                      {claimCount} claim{claimCount !== 1 ? 's' : ''}
                    </span>
                    {pendingCount > 0 && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
                        style={{ background: '#1a2a1a', color: '#4ade80', border: '1px solid #14532d' }}>
                        {pendingCount} pending
                      </span>
                    )}
                  </div>
                  <Link href={`/my-posts/${post.id}`}
                    className="text-xs font-medium" style={{ color: '#185FA5' }}>
                    View claims →
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </main>
  )
}