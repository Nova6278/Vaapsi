import Link from "next/link"

export default function DemoRestricted() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#050a15' }}>
      <div className="rounded-2xl p-8 text-center max-w-sm w-full"
        style={{ background: 'rgba(13,18,37,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(20px)' }}>
        <div className="text-4xl mb-4">🔒</div>
        <h1 className="text-lg font-bold mb-2" style={{ color: '#f0f2f5' }}>
          Demo accounts cannot post
        </h1>
        <p className="text-sm mb-6" style={{ color: '#8b92a5' }}>
          You are browsing in demo mode. Create a real KIIT account to post lost or found items.
        </p>
        <div className="flex flex-col gap-3">
          <Link href="/signup"
            className="w-full py-3 rounded-xl text-sm font-semibold text-white text-center transition-opacity hover:opacity-90"
            style={{ background: '#185FA5' }}>
            Create account
          </Link>
          <Link href="/dashboard"
            className="w-full py-3 rounded-xl text-sm font-semibold text-center transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.04)', color: '#8b92a5', border: '1px solid rgba(255,255,255,0.06)' }}>
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  )
}