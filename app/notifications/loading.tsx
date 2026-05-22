export default function NotificationsLoading() {
  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-xl mx-auto">
        <div className="mb-6">
          <div className="h-6 w-36 rounded animate-pulse" style={{ background: '#111830' }} />
          <div className="h-3 w-20 rounded mt-2 animate-pulse" style={{ background: '#111830' }} />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse"
              style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#111830' }} />
                  <div className="h-4 w-4 rounded" style={{ background: '#111830' }} />
                </div>
                <div className="h-3 w-24 rounded" style={{ background: '#111830' }} />
              </div>
              <div className="h-4 w-full rounded mb-1" style={{ background: '#111830' }} />
              <div className="h-4 w-3/4 rounded" style={{ background: '#111830' }} />
              <div className="h-3 w-28 rounded mt-3" style={{ background: '#111830' }} />
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}