import React from 'react'
import type { Metadata } from 'next'
import GalleryGrid from '@/components/GalleryGrid'
import fs from 'fs'
import path from 'path'

export const metadata: Metadata = {
  title: 'Galerie | Ryby Semín',
  description: 'Fotogalerie úlovků, areálu a přírody kolem vodní nádrže Tomášek v Semíně.',
  keywords: ['Ryby Semín', 'fotogalerie', 'sportovní rybolov', 'Semín', 'rybník Tomášek'],
  openGraph: {
    title: 'Galerie – Ryby Semín',
    description: 'Fotogalerie úlovků, areálu a přírody kolem vodní nádrže Tomášek v Semíně.',
    url: 'https://rybysemin.cz/galerie',
    siteName: 'Ryby Semín',
    images: [{ url: '/og-home.jpg', width: 1200, height: 630, alt: 'Galerie Ryby Semín' }],
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Galerie – Ryby Semín',
    description: 'Fotogalerie úlovků, areálu a přírody kolem vodní nádrže Tomášek v Semíně.',
    images: ['/og-home.jpg'],
  },
}

// Dynamically read all images placed in /public/galerie
// This runs on the server, so Node's fs/path are available.
function loadGalleryImages(): string[] {
  const dir = path.join(process.cwd(), 'public', 'galerie')

  if (!fs.existsSync(dir)) return []

  const files = fs
    .readdirSync(dir)
    .filter((file) => /\.(png|jpe?g|gif|webp|svg)$/i.test(file))

  // Sort by leading number if present (natural order 1,2,10) else alphabetically
  files.sort((a, b) => {
    const numA = parseInt(a.match(/^(\d+)/)?.[1] || 'Infinity', 10)
    const numB = parseInt(b.match(/^(\d+)/)?.[1] || 'Infinity', 10)
    if (numA !== numB) return numA - numB
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  })

  return files.map((file) => `/galerie/${encodeURIComponent(file)}`)
}

const galleryImages = loadGalleryImages()

export default function GalleryPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid gap-8">
        {/* Left column */}
        <article className="prose max-w-none prose-blue">
          <h1 className="text-4xl font-bold text-blue-700 mb-6">Galerie</h1>
          {/* Image grid */}
          <GalleryGrid images={galleryImages} />
        </article>
      </div>
    </main>
  )
} 