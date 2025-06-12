import React from 'react'
import type { Metadata } from 'next'
import FacebookFeed from '@/components/FacebookFeed'
import GalleryGrid from '@/components/GalleryGrid'

export const metadata: Metadata = {
  title: 'Galerie | Ryby Semín',
  description: 'Fotogalerie úlovků, areálu a přírody kolem vodní nádrže Tomášek v Semíně.',
  keywords: ['Ryby Semín', 'fotogalerie', 'sportovní rybolov', 'Semín', 'rybník Tomášek'],
}

const galleryImages = [
  '/gallery2.JPG',
  '/gallery3.JPG',
  '/gallery4.JPG',
  '/gallery1.JPG',
]

export default function GalleryPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        {/* Left column */}
        <article className="prose max-w-none prose-blue">
          <h1 className="text-4xl font-bold text-blue-700 mb-6">Galerie</h1>
          {/* Image grid */}
          <GalleryGrid images={galleryImages} />
        </article>

        {/* Facebook feed */}
        <aside className="lg:sticky lg:top-32">
          <FacebookFeed />
        </aside>
      </div>
    </main>
  )
} 