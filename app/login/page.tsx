'use client'

import { useState, useEffect } from 'react'
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

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.push('/dashboard')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
    <div className="relative min-h-screen overflow-hidden flex items-center justify-center px-4"
      style={{ background: '#050a15' }}>

      {/* ── Animated background — cool blue tones ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #185FA5 0%, transparent 70%)',
            animation: 'loginFloat1 14s ease-in-out infinite',
          }} />
        <div className="absolute bottom-[-15%] left-[-5%] w-[400px] h-[400px] rounded-full opacity-12"
          style={{
            background: 'radial-gradient(circle, #1e3a5f 0%, transparent 70%)',
            animation: 'loginFloat2 11s ease-in-out infinite',
          }} />
        <div className="absolute top-[50%] left-[60%] w-[300px] h-[300px] rounded-full opacity-8"
          style={{
            background: 'radial-gradient(circle, #0d4280 0%, transparent 70%)',
            animation: 'loginFloat3 9s ease-in-out infinite',
          }} />

        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }} />

        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }} />

        {/* Particles — blue/white theme */}
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: i % 2 === 0 ? '#185FA5' : 'rgba(255,255,255,0.5)',
              left: `${(i * 8.33) % 100}%`,
              top: `${(i * 11.7 + 5) % 100}%`,
              opacity: 0.2 + (i % 4) * 0.1,
              animation: `loginParticle ${7 + (i % 6)}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`,
            }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-sm" style={{ animation: 'loginFadeUp 0.6s ease-out both' }}>

        {/* Logo */}
        <div className="text-center mb-8">
          <span style={{
            fontSize: '32px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            background: 'linear-gradient(135deg, #FDE68A 0%, #D4AF37 50%, #A68A3E 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Vaapsi
          </span>
          <p className="text-xs mt-1 uppercase tracking-widest" style={{ color: '#4a5068' }}>
            Campus Lost & Found
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6"
          style={{
            background: 'rgba(13,18,37,0.7)',
            border: '1px solid rgba(255,255,255,0.06)',
            backdropFilter: 'blur(20px)',
          }}>

          <h1 className="text-lg font-bold mb-1" style={{ color: '#f0f2f5' }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>
            Sign in with your college email
          </p>

          <div className="flex flex-col gap-3">
            <input
              type="email"
              placeholder="you@kiit.ac.in"
              aria-label="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.border = '1px solid #185FA5')}
              onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}
            />
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
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

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes loginFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-25px, 35px) scale(1.06); }
          66% { transform: translate(15px, -20px) scale(0.94); }
        }
        @keyframes loginFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -25px) scale(1.1); }
        }
        @keyframes loginFloat3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes loginParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-15px) scale(1.4); opacity: 0.5; }
        }
        @keyframes loginFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}