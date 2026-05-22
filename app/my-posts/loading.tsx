export default function MyPostsLoading() {
  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="h-6 w-28 rounded animate-pulse" style={{ background: '#111830' }} />
          <div className="h-3 w-52 rounded mt-2 animate-pulse" style={{ background: '#111830' }} />
        </div>
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl p-5 animate-pulse"
              style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-5 w-14 rounded-full" style={{ background: '#111830' }} />
                <div className="h-5 w-14 rounded-full" style={{ background: '#111830' }} />
              </div>
              <div className="h-5 w-40 rounded mb-4" style={{ background: '#111830' }} />
              <div className="pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center justify-between">
                  <div className="h-3 w-20 rounded" style={{ background: '#111830' }} />
                  <div className="h-3 w-24 rounded" style={{ background: '#111830' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}