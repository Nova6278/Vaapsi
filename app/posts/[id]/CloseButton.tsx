'use client'

import { useRouter } from 'next/navigation'

export default function CloseButton() {
  const router = useRouter()
  return (
    <button
      onClick={() => router.back()}
      aria-label="Go back"
      className="flex items-center gap-1.5 text-xs font-medium transition-opacity hover:opacity-80 mb-4"
      style={{ color: '#8b92a5' }}
    >
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
        strokeWidth={2} stroke="currentColor" className="w-4 h-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
      </svg>
      Back
    </button>
  )
}