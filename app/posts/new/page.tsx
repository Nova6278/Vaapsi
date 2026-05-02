'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function NewPost() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [form, setForm] = useState({
    type: 'lost',
    title: '',
    category: '',
    location: '',
    description: '',
    verification_question: '',
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setImageFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setImagePreview(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { setError('You must be logged in to post.'); setLoading(false); return }

    let photoUrl: string | null = null
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, imageFile)
      if (uploadError) { setError(`Image upload failed: ${uploadError.message}`); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName)
      photoUrl = urlData.publicUrl
    }

    const { error: insertError } = await supabase.from('posts').insert({
      ...form, user_id: user.id, status: 'active', photo_url: photoUrl,
    })

    if (insertError) { setError(insertError.message); setLoading(false); return }
    router.push('/dashboard')
  }

  const inputStyle = {
    background: '#111830',
    border: '1px solid rgba(255,255,255,0.06)',
    color: '#f0f2f5',
    borderRadius: '12px',
    padding: '12px 16px',
    width: '100%',
    fontSize: '14px',
    outline: 'none',
  }

  const focusHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.border = '1px solid #185FA5')
  const blurHandler = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>Report Item</h1>
          <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>Lost something? Found something? Post it here.</p>
        </div>

        <div className="rounded-2xl p-6"
          style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>

          {error && (
            <div className="mb-4 rounded-xl px-4 py-3 text-sm"
              style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Type toggle */}
            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              {['lost', 'found'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm({ ...form, type: t })}
                  className="flex-1 py-2.5 text-sm font-semibold capitalize transition-all"
                  style={form.type === t
                    ? t === 'lost'
                      ? { background: '#3d1515', color: '#f87171' }
                      : { background: '#14301f', color: '#4ade80' }
                    : { background: 'transparent', color: '#4a5068' }
                  }>
                  {t === 'lost' ? '🔍 Lost' : '📦 Found'}
                </button>
              ))}
            </div>

            <input name="title" placeholder="Item name (e.g. Blue water bottle)"
              value={form.title} onChange={handleChange} required
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />

            <input name="category" placeholder="Category (e.g. Electronics, ID Card)"
              value={form.category} onChange={handleChange} required
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />

            <input name="location" placeholder="Location (e.g. Library, Block 7)"
              value={form.location} onChange={handleChange} required
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />

            <textarea name="description" placeholder="Description (optional)"
              value={form.description} onChange={handleChange} rows={3}
              style={{ ...inputStyle, resize: 'none' }}
              onFocus={focusHandler} onBlur={blurHandler} />

            <input name="verification_question"
              placeholder="Verification question (e.g. What colour is the cap?)"
              value={form.verification_question} onChange={handleChange}
              style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />

            {/* Image upload */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5068' }}>
                Photo (optional)
              </p>
              <label className="flex items-center justify-center w-full py-4 rounded-xl cursor-pointer transition-colors"
                style={{ background: '#111830', border: '2px dashed rgba(255,255,255,0.08)', color: '#8b92a5' }}>
                <span className="text-sm">📷 Click to upload image</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && (
                <img src={imagePreview} alt="Preview"
                  className="mt-3 rounded-xl w-full max-h-48 object-cover" />
              )}
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#185FA5' }}>
              {loading ? 'Posting...' : 'Submit Post'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}