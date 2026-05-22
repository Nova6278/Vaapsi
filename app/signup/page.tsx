'use client'
import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

function getPasswordStrength(pw: string) {
  const checks = [
    { label: '6+ characters', met: pw.length >= 6 },
    { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
    { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
    { label: 'Number', met: /[0-9]/.test(pw) },
    { label: 'Special character', met: /[^A-Za-z0-9]/.test(pw) },
  ]
  const score = checks.filter(c => c.met).length
  let level: 'weak' | 'fair' | 'strong' = 'weak'
  let color = '#f87171'
  if (score >= 4) { level = 'strong'; color = '#4ade80' }
  else if (score >= 2) { level = 'fair'; color = '#facc15' }
  return { checks, score, level, color }
}

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const strength = getPasswordStrength(password)

  const handleSignup = async () => {
    setError('')
    if (!email.endsWith('@kiit.ac.in')) {
      setError('Only KIIT email addresses (@kiit.ac.in) are allowed.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    if (data.session) { router.push('/dashboard'); return }
    router.push('/signup/confirm')
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

      {/* ── Animated background — warm saffron/green tones ── */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-15%] w-[450px] h-[450px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)',
            animation: 'signupFloat1 13s ease-in-out infinite',
          }} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full opacity-12"
          style={{
            background: 'radial-gradient(circle, #A68A3E 0%, transparent 70%)',
            animation: 'signupFloat2 10s ease-in-out infinite',
          }} />
        <div className="absolute top-[60%] left-[40%] w-[350px] h-[350px] rounded-full opacity-8"
          style={{
            background: 'radial-gradient(circle, #FDE68A 0%, transparent 70%)',
            animation: 'signupFloat3 15s ease-in-out infinite',
          }} />

        {/* Grid — slightly larger cells */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '70px 70px',
          }} />

        {/* Noise */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }} />

        {/* Particles — saffron/green/white */}
        {Array.from({ length: 15 }).map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${2 + (i % 3)}px`,
              height: `${2 + (i % 3)}px`,
              background: i % 3 === 0 ? '#FDE68A' : i % 3 === 1 ? '#D4AF37' : '#A68A3E',
              left: `${(i * 7.14 + 3) % 100}%`,
              top: `${(i * 9.3 + 8) % 100}%`,
              opacity: 0.2 + (i % 4) * 0.1,
              animation: `signupParticle ${8 + (i % 5)}s ease-in-out infinite`,
              animationDelay: `${i * 0.6}s`,
            }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 w-full max-w-sm" style={{ animation: 'signupFadeUp 0.6s ease-out both' }}>

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

          <h1 className="text-lg font-bold mb-1" style={{ color: '#f0f2f5' }}>Join Vaapsi</h1>
          <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>
            Use your college email to get started.
          </p>

          <div className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Your name"
              aria-label="Full name"
              value={name}
              onChange={e => setName(e.target.value)}
              style={inputStyle}
              onFocus={e => (e.currentTarget.style.border = '1px solid #185FA5')}
              onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}
            />
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
            <div>
              <input
                type="password"
                placeholder="Password (min 6 characters)"
                aria-label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                onFocus={e => (e.currentTarget.style.border = '1px solid #185FA5')}
                onBlur={e => (e.currentTarget.style.border = '1px solid rgba(255,255,255,0.06)')}
                onKeyDown={e => e.key === 'Enter' && handleSignup()}
              />

              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div
                        key={i}
                        className="h-1 flex-1 rounded-full transition-all duration-300"
                        style={{
                          background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.06)',
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs mt-1 font-medium capitalize" style={{ color: strength.color }}>
                    {strength.level}
                  </p>
                  <div className="mt-1 flex flex-col gap-0.5">
                    {strength.checks.map(c => (
                      <span key={c.label} className="text-xs" style={{ color: c.met ? '#4ade80' : '#4a5068' }}>
                        {c.met ? '✓' : '○'} {c.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-3 rounded-xl px-4 py-3 text-sm"
              style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
              {error}
            </div>
          )}

          <button onClick={handleSignup} disabled={loading}
            className="mt-4 w-full py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ background: '#185FA5' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>

          <p className="text-center text-sm mt-4" style={{ color: '#8b92a5' }}>
            Already have an account?{' '}
            <a href="/login" style={{ color: '#185FA5' }}>Sign in</a>
          </p>
        </div>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes signupFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(20px, -30px) scale(1.08); }
          66% { transform: translate(-15px, 25px) scale(0.93); }
        }
        @keyframes signupFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-35px, 20px) scale(1.12); }
        }
        @keyframes signupFloat3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.18); }
        }
        @keyframes signupParticle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.2; }
          50% { transform: translateY(-18px) scale(1.3); opacity: 0.5; }
        }
        @keyframes signupFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}