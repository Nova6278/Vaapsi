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

  return (
    <main className="max-w-2xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vaapsi — Lost & Found</h1>
        <Link
          href="/posts/new"
          className="bg-black text-white px-4 py-2 rounded-lg text-sm"
        >
          + New Post
        </Link>
      </div>

      {posts && posts.length === 0 && (
        <p className="text-gray-500 text-center mt-20">No posts yet. Be the first!</p>
      )}

      <div className="flex flex-col gap-4">
        {posts?.map((post) => (
          <Link key={post.id} href={`/posts/${post.id}`}>
            <div className="border rounded-xl p-4 shadow-sm cursor-pointer hover:border-gray-500">
              <div className="flex justify-between items-start">
                <span
                  className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${
                    post.type === 'lost'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-green-100 text-green-600'
                  }`}
                >
                  {post.type}
                </span>
                <span className="text-xs text-gray-400">{post.category}</span>
              </div>
              <h2 className="text-lg font-semibold mt-2">{post.title}</h2>
              <p className="text-sm text-gray-500 mt-1">📍 {post.location}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}