import Link from "next/link"

export default function ConfirmPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-white">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Check your email ✉️</h1>
        <p className="text-gray-400">We sent a confirmation link to your KIIT email.</p>
        <p className="text-gray-500 text-sm mt-2">After confirming, you can close this tab.</p>
        <Link
          href="/login"
          className="inline-block mt-4 text-sm text-blue-400 hover:text-blue-300 underline"
        >
          Back to login
        </Link>
      </div>
    </div>
  )
}