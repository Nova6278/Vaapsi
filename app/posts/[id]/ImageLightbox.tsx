'use client'

import { useState } from 'react'
import Image from 'next/image'

export default function ImageLightbox({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <div
        className="relative h-64 overflow-hidden cursor-zoom-in"
        onClick={() => setOpen(true)}
      >
        <Image src={src} alt={alt} fill className="object-cover" unoptimized />
        <div className="absolute inset-0 transition-opacity hover:opacity-80"
          style={{ background: 'linear-gradient(to top, #0d1225cc, transparent)' }} />
        <span className="absolute bottom-3 right-3 text-xs px-2 py-1 rounded-lg"
          style={{ background: 'rgba(0,0,0,0.6)', color: '#f0f2f5' }}>
          🔍 Click to enlarge
        </span>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.92)' }}
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-2xl font-bold"
            style={{ color: '#f0f2f5' }}
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          <div className="relative w-full max-w-2xl max-h-[85vh] aspect-video">
            <Image
              src={src}
              alt={alt}
              fill
              className="object-contain"
              unoptimized
            />
          </div>
          <p className="absolute bottom-4 text-xs" style={{ color: '#4a5068' }}>
            Click anywhere to close
          </p>
        </div>
      )}
    </>
  )
}