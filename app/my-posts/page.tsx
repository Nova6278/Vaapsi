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
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">My Posts</h1>

      {posts?.length === 0 && (
        <p className="text-gray-500">You have not posted anything yet.</p>
      )}

      <div className="flex flex-col gap-4">
        {posts?.map((post) => (
          <div key={post.id} className="border rounded-xl p-4">
            <div className="flex justify-between">
              <h2 className="font-semibold">{post.title}</h2>
              <span className="text-xs text-gray-400">{post.status}</span>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {post.claims?.length ?? 0} claim(s)
            </p>
            <Link href={`/my-posts/${post.id}`} className="text-sm text-blue-400 mt-2 block">
              View claims →
            </Link>
          </div>
        ))}
      </div>
    </main>
  )
}