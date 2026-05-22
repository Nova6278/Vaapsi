import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden" style={{ background: '#050a15' }}>

      {/* ── Animated background ── */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #FF9933 0%, transparent 70%)',
            animation: 'float1 12s ease-in-out infinite',
          }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #138808 0%, transparent 70%)',
            animation: 'float2 14s ease-in-out infinite',
          }} />
        <div className="absolute top-[40%] left-[50%] w-[400px] h-[400px] rounded-full opacity-10"
          style={{
            background: 'radial-gradient(circle, #185FA5 0%, transparent 70%)',
            animation: 'float3 10s ease-in-out infinite',
          }} />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          }} />

        {/* Floating particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="absolute rounded-full"
            style={{
              width: `${2 + (i % 4)}px`,
              height: `${2 + (i % 4)}px`,
              background: i % 3 === 0 ? '#FF9933' : i % 3 === 1 ? '#ffffff' : '#138808',
              left: `${(i * 5.26) % 100}%`,
              top: `${(i * 7.37 + 10) % 100}%`,
              opacity: 0.3 + (i % 5) * 0.1,
              animation: `particle ${6 + (i % 8)}s ease-in-out infinite`,
              animationDelay: `${i * 0.4}s`,
            }} />
        ))}
      </div>

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">

        {/* Hero */}
        <div className="text-center max-w-2xl"
          style={{ animation: 'fadeUp 0.8s ease-out both' }}>

          {/* Title */}
          <h1 className="mb-3" style={{
            fontSize: 'clamp(48px, 8vw, 80px)',
            fontWeight: 900,
            letterSpacing: '-2px',
            lineHeight: 1,
            background: 'linear-gradient(135deg, #FF9933 0%, #FF9933 25%, #ffffff 45%, #ffffff 55%, #138808 75%, #138808 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            animation: 'fadeUp 0.8s ease-out 0.1s both',
          }}>
            Vaapsi
          </h1>

          {/* Tagline */}
          <p className="uppercase tracking-[0.35em] mb-8" style={{
            color: '#4a5068',
            fontSize: '11px',
            fontWeight: 600,
            letterSpacing: '0.35em',
            animation: 'fadeUp 0.8s ease-out 0.2s both',
          }}>
            Campus Lost & Found
          </p>

          {/* Description */}
          <p className="text-lg mb-12 max-w-md mx-auto leading-relaxed" style={{
            color: '#8b92a5',
            animation: 'fadeUp 0.8s ease-out 0.3s both',
          }}>
            Lost something on campus? Found something that isn&apos;t yours?
            <span style={{ color: '#f0f2f5', fontWeight: 600 }}> Reunite items with their owners.</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            style={{ animation: 'fadeUp 0.8s ease-out 0.4s both' }}>
            <Link href="/signup"
              className="group relative px-8 py-3.5 rounded-xl text-sm font-bold text-white overflow-hidden transition-all duration-300"
              style={{ background: '#185FA5', minWidth: '180px' }}>
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ background: 'linear-gradient(135deg, #1a6bb5 0%, #185FA5 50%, #14508a 100%)' }} />
            </Link>
            <Link href="/login"
              className="group px-8 py-3.5 rounded-xl text-sm font-semibold transition-all duration-300"
              style={{
                color: '#8b92a5',
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
                minWidth: '180px',
              }}>
              <span className="group-hover:text-white transition-colors duration-300">Sign In →</span>
            </Link>
          </div>
        </div>

        {/* How it works */}
        <div className="w-full max-w-3xl"
          style={{ animation: 'fadeUp 0.8s ease-out 0.5s both' }}>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { step: '01', icon: '📢', title: 'Post', desc: 'Report your lost or found item with details and a photo' },
              { step: '02', icon: '🔐', title: 'Verify', desc: 'Claimants answer your verification question to prove ownership' },
              { step: '03', icon: '🤝', title: 'Reunite', desc: 'Confirm the rightful owner and return the item safely' },
            ].map((item, i) => (
              <div key={i}
                className="group relative rounded-2xl p-6 transition-all duration-500 cursor-default"
                style={{
                  background: 'rgba(13,18,37,0.6)',
                  border: '1px solid rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(20px)',
                }}>
                <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background: i === 0
                      ? 'radial-gradient(circle at 50% 50%, rgba(255,153,51,0.06) 0%, transparent 70%)'
                      : i === 1
                        ? 'radial-gradient(circle at 50% 50%, rgba(255,255,255,0.04) 0%, transparent 70%)'
                        : 'radial-gradient(circle at 50% 50%, rgba(19,136,8,0.06) 0%, transparent 70%)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '16px',
                  }} />

                <div className="relative z-10">
                  <span className="text-xs font-mono mb-3 block" style={{
                    color: i === 0 ? '#FF9933' : i === 1 ? '#ffffff' : '#138808',
                    opacity: 0.5,
                  }}>
                    {item.step}
                  </span>
                  <span className="text-2xl mb-3 block">{item.icon}</span>
                  <h3 className="text-base font-bold mb-2" style={{ color: '#f0f2f5' }}>{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#4a5068' }}>{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="w-full max-w-3xl mt-20 mb-8"
          style={{ animation: 'fadeUp 0.8s ease-out 0.9s both' }}>

          <div className="h-px w-full mb-8" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)' }} />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold" style={{
                background: 'linear-gradient(135deg, #FF9933, #ffffff, #138808)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>Vaapsi</span>
              <span className="text-xs" style={{ color: '#4a5068' }}>•</span>
              <span className="text-xs" style={{ color: '#4a5068' }}>© {new Date().getFullYear()}</span>
            </div>

            <div className="flex items-center gap-6">
              <Link href="/terms" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#4a5068' }}>
                Terms
              </Link>
              <Link href="/privacy" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#4a5068' }}>
                Privacy
              </Link>
              <a href="mailto:rajdeepoff78@gmail.com" className="text-xs transition-colors duration-200 hover:text-white" style={{ color: '#4a5068' }}>
                Contact
              </a>
            </div>
          </div>
        </footer>
      </div>

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -40px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
        @keyframes float2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(-40px, 30px) scale(1.08); }
          66% { transform: translate(25px, -25px) scale(0.92); }
        }
        @keyframes float3 {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.15); }
        }
        @keyframes particle {
          0%, 100% { transform: translateY(0) scale(1); opacity: 0.3; }
          50% { transform: translateY(-20px) scale(1.5); opacity: 0.6; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </main>
  );
}