'use client'

import React, { useState } from 'react'

interface GalleryGridProps {
  images: string[]
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [current, setCurrent] = useState<number | null>(null)

  const close = () => setCurrent(null)

  // Allow both mouse clicks and keyboard calls (where event might be undefined)
  const prev = (e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation()
    if (current === null) return
    setCurrent((current - 1 + images.length) % images.length)
  }

  const next = (e?: React.MouseEvent | KeyboardEvent) => {
    if (e && 'stopPropagation' in e) e.stopPropagation()
    if (current === null) return
    setCurrent((current + 1) % images.length)
  }

  // Keyboard navigation when lightbox is open
  React.useEffect(() => {
    if (current === null) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        prev()
      } else if (e.key === 'ArrowRight') {
        next()
      } else if (e.key === 'Escape') {
        close()
      }
    }

    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [current])

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-6 gap-6">
        {images.map((src, idx) => (
          <button
            key={src}
            type="button"
            className={`${idx % 5 < 2 ? 'md:col-span-3 aspect-[3/2]' : 'md:col-span-2 aspect-square'} overflow-hidden rounded-xl bg-gray-100 shadow-card hover:shadow-soft transition-transform duration-200 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-semin-blue/30`}
            onClick={() => setCurrent(idx)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`Galerie ${idx + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      {/* Lightbox */}
      {current !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <button
            onClick={prev}
            className="absolute left-4 md:left-12 text-white text-3xl font-bold select-none"
            aria-label="Previous image"
          >
            ‹
          </button>

          <img
            src={images[current]}
            alt="detail"
            className="max-w-full max-h-[90vh] rounded-lg shadow-xl"
          />

          <button
            onClick={next}
            className="absolute right-4 md:right-12 text-white text-3xl font-bold select-none"
            aria-label="Next image"
          >
            ›
          </button>

          <button
            onClick={close}
            className="absolute top-4 right-4 text-white text-3xl font-bold select-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
} 