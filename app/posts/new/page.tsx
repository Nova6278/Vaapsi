'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { sanitize, LIMITS, containsProfanity } from '@/lib/sanitize'
import { isValidImage, MAX_POST_IMAGE } from '@/lib/validate-image'
import { DEMO_ACCOUNT_IDS } from '@/lib/demo'
import Image from 'next/image'

const CATEGORIES = [
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

export default function NewPost() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { window.location.href = '/login'; return }
      if (DEMO_ACCOUNT_IDS.has(user.id)) { window.location.href = '/posts/new/demo'; return }
    })
  }, [])

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
    const { name, value } = e.target
    const limit = LIMITS[name as keyof typeof LIMITS]
    if (limit && value.length > limit) return
    setForm({ ...form, [name]: value })
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setError('')

    if (file) {
      if (file.size > MAX_POST_IMAGE) {
        setError('Image must be under 2MB.')
        e.target.value = ''
        return
      }
      const valid = await isValidImage(file)
      if (!valid) {
        setError('Invalid image file. Only JPG, PNG, WebP, and GIF allowed.')
        e.target.value = ''
        return
      }
    }

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

    const cleaned = {
      type: form.type,
      title: sanitize(form.title, LIMITS.title),
      category: form.category,
      location: sanitize(form.location, LIMITS.location),
      description: sanitize(form.description, LIMITS.description),
      verification_question: form.type === 'found' ? sanitize(form.verification_question, LIMITS.verification_question) : '',
    }

    if (!cleaned.title || !cleaned.category || !cleaned.location) {
      setError('Title, category, and location are required.')
      setLoading(false)
      return
    }

    const fieldsToCheck = [cleaned.title, cleaned.location, cleaned.description, cleaned.verification_question]
    if (fieldsToCheck.some(f => containsProfanity(f))) {
      setError('Your post contains inappropriate language. Please revise.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) { setError('You must be logged in to post.'); setLoading(false); return }
    if (DEMO_ACCOUNT_IDS.has(user.id)) { setError('Demo accounts cannot create posts. Create a real account.'); setLoading(false); return }

    let photoUrl: string | null = null
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()?.toLowerCase()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, imageFile)
      if (uploadError) { setError(`Image upload failed: ${uploadError.message}`); setLoading(false); return }
      photoUrl = fileName
    }

    const { data: newPost, error: insertError } = await supabase.from('posts').insert({
      ...cleaned, user_id: user.id, status: 'active', photo_url: photoUrl,
    }).select('id').single()

    if (insertError) { setError(insertError.message); setLoading(false); return }

    if (newPost && cleaned.type === 'found' && cleaned.category) {
      fetch('/api/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          postId: newPost.id,
          category: cleaned.category,
          title: cleaned.title,
        }),
      }).catch(() => {})
    }

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

  const charCount = (field: keyof typeof LIMITS) => (
    <span className="text-xs mt-1 block text-right" style={{ color: '#4a5068' }}>
      {form[field as keyof typeof form]?.length ?? 0}/{LIMITS[field]}
    </span>
  )

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

            <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              {['lost', 'found'].map(t => (
                <button key={t} type="button"
                  onClick={() => setForm({ ...form, type: t, ...(t === 'lost' ? { verification_question: '' } : {}) })}
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

            <div>
              <input name="title" placeholder="Item name (e.g. Blue water bottle)"
                aria-label="Item name" value={form.title} onChange={handleChange} required maxLength={LIMITS.title}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              {charCount('title')}
            </div>

            <div>
              <select name="category" value={form.category} onChange={handleChange} required aria-label="Category"
                style={{
                  ...inputStyle,
                  appearance: 'none',
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%238b92a5' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 16px center',
                }}
                onFocus={focusHandler} onBlur={blurHandler}>
                <option value="" disabled style={{ color: '#4a5068' }}>Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat} style={{ background: '#111830', color: '#f0f2f5' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input name="location" placeholder="Location (e.g. Library, Block 7)"
                aria-label="Location" value={form.location} onChange={handleChange} required maxLength={LIMITS.location}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              {charCount('location')}
            </div>

            <div>
              <textarea name="description" placeholder="Description (optional)"
                aria-label="Description" value={form.description} onChange={handleChange} rows={3} maxLength={LIMITS.description}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={focusHandler} onBlur={blurHandler} />
              {charCount('description')}
            </div>

            {form.type === 'found' && (
              <div>
                <input name="verification_question"
                  placeholder="Verification question (e.g. What colour is the cap?)"
                  aria-label="Verification question" value={form.verification_question} onChange={handleChange} maxLength={LIMITS.verification_question}
                  style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                {charCount('verification_question')}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5068' }}>
                Photo (optional) — JPG, PNG, WebP, GIF · Max 2MB
              </p>
              <label className="flex items-center justify-center w-full py-4 rounded-xl cursor-pointer transition-colors"
                style={{ background: '#111830', border: '2px dashed rgba(255,255,255,0.08)', color: '#8b92a5' }}>
                <span className="text-sm">📷 Click to upload image</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" aria-label="Upload photo" onChange={handleImageChange} className="hidden" />
              </label>
              {imagePreview && (
                <div className="mt-3 relative w-full h-48 rounded-xl overflow-hidden">
                  <Image src={imagePreview} alt="Preview of uploaded image"
                    fill className="object-cover" unoptimized />
                </div>
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