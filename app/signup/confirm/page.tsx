import Link from "next/link"

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#050a15' }}>
      <div className="rounded-2xl p-8 text-center max-w-sm w-full"
        style={{
          background: 'rgba(13,18,37,0.7)',
          border: '1px solid rgba(255,255,255,0.06)',
          backdropFilter: 'blur(20px)',
        }}>
        <div className="text-4xl mb-4">✉️</div>
        <h1 className="text-xl font-bold mb-2" style={{ color: '#f0f2f5' }}>
          Check your email
        </h1>
        <p className="text-sm mb-1" style={{ color: '#8b92a5' }}>
          We sent a confirmation link to your KIIT email.
        </p>
        <p className="text-xs mb-6" style={{ color: '#4a5068' }}>
          Click the link in the email to activate your account.
        </p>
        <Link href="/login"
          className="inline-block px-6 py-2.5 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
          style={{ background: '#185FA5', color: '#fff' }}>
          Back to login
        </Link>
      </div>
    </div>
  )
}