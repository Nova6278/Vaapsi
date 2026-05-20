'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter, useParams } from 'next/navigation'
import { sanitize, LIMITS, containsProfanity } from '@/lib/sanitize'
import { isValidImage, MAX_POST_IMAGE } from '@/lib/validate-image'
import Link from 'next/link'
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

export default function EditPost() {
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string

  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [existingImage, setExistingImage] = useState<string | null>(null)
  const [unauthorized, setUnauthorized] = useState(false)

  const [form, setForm] = useState({
    type: 'lost',
    title: '',
    category: '',
    location: '',
    description: '',
    verification_question: '',
  })

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    const fetchPost = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: post } = await supabase
        .from('posts')
        .select('*')
        .eq('id', postId)
        .single()

      if (!post || post.user_id !== user.id) {
        setUnauthorized(true)
        setFetching(false)
        return
      }

      setForm({
        type: post.type,
        title: post.title,
        category: post.category ?? '',
        location: post.location ?? '',
        description: post.description ?? '',
        verification_question: post.verification_question ?? '',
      })
      setExistingImage(post.photo_url)
      setFetching(false)
    }
    fetchPost()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId])

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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('You must be logged in.'); setLoading(false); return }

    let photoUrl: string | null = existingImage
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop()?.toLowerCase()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('post-images').upload(fileName, imageFile)
      if (uploadError) { setError(`Image upload failed: ${uploadError.message}`); setLoading(false); return }
      const { data: urlData } = supabase.storage.from('post-images').getPublicUrl(fileName)
      photoUrl = urlData.publicUrl
    }

    const { error: updateError } = await supabase
      .from('posts')
      .update({ ...cleaned, photo_url: photoUrl })
      .eq('id', postId)
      .eq('user_id', user.id)

    if (updateError) { setError(updateError.message); setLoading(false); return }
    router.push('/my-posts')
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

  if (fetching) return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="flex items-center justify-center">
      <p style={{ color: '#8b92a5' }}>Loading...</p>
    </main>
  )

  if (unauthorized) return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="flex items-center justify-center px-4">
      <div className="rounded-2xl p-8 text-center max-w-sm w-full"
        style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-4xl mb-4">🚫</p>
        <h1 className="text-lg font-bold mb-2" style={{ color: '#f0f2f5' }}>Access denied</h1>
        <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>You can only edit your own posts.</p>
        <Link href="/my-posts"
          className="inline-block py-2.5 px-6 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#185FA5' }}>
          Go to my posts
        </Link>
      </div>
    </main>
  )

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: '#f0f2f5' }}>Edit Post</h1>
          <p className="text-sm mt-1" style={{ color: '#8b92a5' }}>Update your lost or found item details.</p>
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
                value={form.title} onChange={handleChange} required maxLength={LIMITS.title}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              {charCount('title')}
            </div>

            <div>
              <select name="category" value={form.category} onChange={handleChange} required
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
                value={form.location} onChange={handleChange} required maxLength={LIMITS.location}
                style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
              {charCount('location')}
            </div>

            <div>
              <textarea name="description" placeholder="Description (optional)"
                value={form.description} onChange={handleChange} rows={3} maxLength={LIMITS.description}
                style={{ ...inputStyle, resize: 'none' }}
                onFocus={focusHandler} onBlur={blurHandler} />
              {charCount('description')}
            </div>

            {form.type === 'found' && (
              <div>
                <input name="verification_question"
                  placeholder="Verification question (e.g. What colour is the cap?)"
                  value={form.verification_question} onChange={handleChange} maxLength={LIMITS.verification_question}
                  style={inputStyle} onFocus={focusHandler} onBlur={blurHandler} />
                {charCount('verification_question')}
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: '#4a5068' }}>
                Photo — JPG, PNG, WebP, GIF · Max 2MB
              </p>
              {(existingImage || imagePreview) && (
                <div className="mb-3 relative w-full h-48 rounded-xl overflow-hidden">
                  <Image src={imagePreview ?? existingImage!} alt="Preview"
                    fill className="object-cover" unoptimized />
                </div>
              )}
              <label className="flex items-center justify-center w-full py-4 rounded-xl cursor-pointer transition-colors"
                style={{ background: '#111830', border: '2px dashed rgba(255,255,255,0.08)', color: '#8b92a5' }}>
                <span className="text-sm">{existingImage ? '📷 Replace image' : '📷 Click to upload image'}</span>
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: '#185FA5' }}>
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>

          <Link href="/my-posts" className="block mt-4 text-center text-xs" style={{ color: '#4a5068' }}>
            ← Back to my posts
          </Link>
        </div>
      </div>
    </main>
  )
}