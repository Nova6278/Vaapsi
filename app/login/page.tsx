'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async () => {
    setError('')
    if (!email.endsWith('@kiit.ac.in')) {
      setError('Only KIIT email addresses (@kiit.ac.in) are allowed.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) setError(error.message)
    else router.push('/dashboard')
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

  return (
    <div style={{ background: '#080c18', minHeight: '100vh' }}
      className="flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        {/* Logo */}
        <div className="text-center mb-8">
          <span style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #FF9933 0%, #FF9933 25%, #ffffff 50%, #138808 75%, #138808 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Vaapsi
          </span>
          <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: '#4a5068' }}>
            KIIT Lost & Found
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
          style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>

          <h1 className="text-lg font-bold mb-1" style={{ color: '#f0f2f5' }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>
            Sign in with your @kiit.ac.in email
          </p>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="you@kiit.ac.in"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.border = '1px solid #185FA5')}
              onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.border = '1px solid #185FA5')}
              onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
            />
          </div>

          {error && (
            <div className="mt-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
              {error}
            </div>
          )}

          <button onClick={handleLogin} disabled={loading}
            className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#185FA5' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm mt-4" style={{ color: '#8b92a5' }}>
            No account?{' '}
            <a href="/signup" style={{ color: '#185FA5' }}>Sign up</a>
          </p>
        </div>
      </div>
    </div>
  )
}