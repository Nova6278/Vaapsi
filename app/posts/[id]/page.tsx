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

  if (!post) return <p className="p-6">Post not found. Error: {error?.message}</p>

  return (
    <main className="max-w-xl mx-auto p-6">
      <div className="flex gap-2 items-center mb-4">
        <span className={`text-xs font-semibold uppercase px-2 py-1 rounded-full ${
          post.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
        }`}>
          {post.type}
        </span>
        <span className="text-xs text-gray-400">{post.category}</span>
      </div>

      <h1 className="text-2xl font-bold">{post.title}</h1>
      <p className="text-sm text-gray-500 mt-1">📍 {post.location}</p>
      <p className="mt-4 text-gray-300">{post.description}</p>

      {post.verification_question && (
        <div className="mt-6 border rounded-xl p-4">
          <p className="text-sm font-semibold mb-1">To claim this item, answer:</p>
          <p className="text-gray-300">{post.verification_question}</p>
        </div>
      )}

      <Link href={`/posts/${id}/claim`}>
        <button className="mt-6 w-full bg-black text-white py-2 rounded-lg font-semibold">
          Claim This Item
        </button>
      </Link>
    </main>
  )
}