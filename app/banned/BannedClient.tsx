'use client'

import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function BannedClient() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <main style={{ background: '#080c18', minHeight: '100vh' }}
      className="flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-2xl p-8"
        style={{ background: '#0d1225', border: '1px solid #7f1d1d' }}>
        <div className="text-5xl mb-4">🚫</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#f0f2f5' }}>Account Banned</h1>
        <p className="text-sm" style={{ color: '#8b92a5' }}>
          Your account has been permanently banned from Vaapsi due to violations of community guidelines.
        </p>
        <p className="text-xs mt-4" style={{ color: '#4a5068' }}>
          If you believe this is a mistake,{' '}
          <a href="mailto:2330427@kiit.ac.in"
            style={{ color: '#185FA5' }}
            className="underline hover:opacity-80 transition-opacity">
            contact the admin
          </a>.
        </p>
        <button
          onClick={handleSignOut}
          className="mt-6 w-full py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-80"
          style={{ background: '#3d1515', color: '#f87171', border: '1px solid #7f1d1d' }}>
          Sign Out
        </button>
      </div>
    </main>
  )
}