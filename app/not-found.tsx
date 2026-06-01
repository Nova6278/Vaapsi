import Link from 'next/link'

export default function NotFound() {
  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }} className="flex items-center justify-center px-4">
      <div className="rounded-2xl p-8 text-center max-w-sm w-full"
        style={{ background: '#0d1225', border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-5xl mb-4">🔍</p>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#f0f2f5' }}>Page not found</h1>
        <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>
          This page does not exist or was removed.
        </p>
        <Link href="/"
          className="inline-block py-2.5 px-6 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: '#185FA5' }}>
          Back to home
        </Link>
      </div>
    </main>
  )
}