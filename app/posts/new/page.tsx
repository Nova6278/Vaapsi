'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function NewPost() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    type: 'lost',
    title: '',
    category: '',
    location: '',
    description: '',
    verification_question: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('You must be logged in to post.')
      setLoading(false)
      return
    }

    const { error: insertError } = await supabase.from('posts').insert({
      ...form,
      user_id: user.id,
      status: 'active',
    })

    if (insertError) {
      setError(insertError.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Report a Lost / Found Item</h1>

      {error && <p className="text-red-500 mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <select name="type" value={form.type} onChange={handleChange} className="border rounded-lg p-2">
          <option value="lost">Lost</option>
          <option value="found">Found</option>
        </select>

        <input name="title" placeholder="Item name (e.g. Blue water bottle)" value={form.title}
          onChange={handleChange} required className="border rounded-lg p-2" />

        <input name="category" placeholder="Category (e.g. Electronics, ID Card)" value={form.category}
          onChange={handleChange} required className="border rounded-lg p-2" />

        <input name="location" placeholder="Location (e.g. Library, Block 7)" value={form.location}
          onChange={handleChange} required className="border rounded-lg p-2" />

        <textarea name="description" placeholder="Description" value={form.description}
          onChange={handleChange} rows={3} className="border rounded-lg p-2" />

        <input name="verification_question" placeholder="Verification question (e.g. What colour is the cap?)"
          value={form.verification_question} onChange={handleChange} className="border rounded-lg p-2" />

        <button type="submit" disabled={loading}
          className="bg-black text-white py-2 rounded-lg font-semibold">
          {loading ? 'Posting...' : 'Submit Post'}
        </button>
      </form>
    </main>
  )
}