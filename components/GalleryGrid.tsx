'use client'

import React, { useState } from 'react'

interface GalleryGridProps {
  images: string[]
}

export default function GalleryGrid({ images }: GalleryGridProps) {
  const [current, setCurrent] = useState<number | null>(null)

  const close = () => setCurrent(null)
  const prev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (current === null) return
    setCurrent((current - 1 + images.length) % images.length)
  }
  const next = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (current === null) return
    setCurrent((current + 1) % images.length)
  }

  return (
    <>
      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {images.map((src, idx) => (
          <button
            key={src}
            type="button"
            className="aspect-square overflow-hidden rounded-xl bg-gray-100 shadow-soft focus:outline-none"
            onClick={() => setCurrent(idx)}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={`Galerie ${idx + 1}`} className="w-full h-full object-cover" />
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