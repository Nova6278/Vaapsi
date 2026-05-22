export default function ProfileLoading() {
  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">

        {/* Profile card */}
        <div className="rounded-2xl p-6 mb-6 animate-pulse"
          style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full" style={{ background: '#111830' }} />
            <div>
              <div className="h-5 w-48 rounded mb-2" style={{ background: '#111830' }} />
              <div className="h-3 w-36 rounded" style={{ background: '#111830' }} />
            </div>
          </div>
        </div>

        {/* Posts stats */}
        <div className="mb-6">
          <div className="h-3 w-24 rounded mb-3 animate-pulse" style={{ background: '#111830' }} />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="rounded-xl p-4 animate-pulse"
                style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-7 w-8 rounded mx-auto mb-2" style={{ background: '#0d1225' }} />
                <div className="h-2 w-12 rounded mx-auto" style={{ background: '#0d1225' }} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3 mt-3">
            <div className="rounded-xl p-4 animate-pulse"
              style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="h-7 w-8 rounded mx-auto mb-2" style={{ background: '#0d1225' }} />
              <div className="h-2 w-24 rounded mx-auto" style={{ background: '#0d1225' }} />
            </div>
          </div>
        </div>

        {/* Claims stats */}
        <div className="mb-6">
          <div className="h-3 w-24 rounded mb-3 animate-pulse" style={{ background: '#111830' }} />
          <div className="grid grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-xl p-4 animate-pulse"
                style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-7 w-8 rounded mx-auto mb-2" style={{ background: '#0d1225' }} />
                <div className="h-2 w-16 rounded mx-auto" style={{ background: '#0d1225' }} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-xl p-4 animate-pulse"
                style={{ background: '#111830', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="h-7 w-8 rounded mx-auto mb-2" style={{ background: '#0d1225' }} />
                <div className="h-2 w-16 rounded mx-auto" style={{ background: '#0d1225' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="rounded-2xl p-5 animate-pulse"
          style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="h-3 w-24 rounded mb-3" style={{ background: '#111830' }} />
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-9 rounded-lg" style={{ background: 'rgba(24,95,165,0.1)' }} />
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}