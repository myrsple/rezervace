import React from 'react'
import FacebookFeed from '@/components/FacebookFeed'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Ceník služeb | Ryby Semín',
  description: 'Aktuální ceny povolenek a služeb pro sportovní rybolov na rybníku Tomášek v Semíně.',
  keywords: ['Ryby Semín', 'ceník', 'povolenky', 'cena rybolov', 'rybník Tomášek', 'Semín'],
  openGraph: {
    title: 'Ceník služeb – Ryby Semín',
    description: 'Aktuální ceny povolenek a půjčovného vybavení pro sportovní rybolov na rybníku Tomášek.',
    url: 'https://rybysemin.cz/cenik-sluzeb',
    siteName: 'Ryby Semín',
    images: [{ url: '/og-home.jpg', width: 1200, height: 630, alt: 'Ceník Ryby Semín' }],
    locale: 'cs_CZ',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ceník služeb – Ryby Semín',
    description: 'Aktuální ceny povolenek a půjčovného vybavení pro sportovní rybolov na rybníku Tomášek.',
    images: ['/og-home.jpg'],
  },
}

interface PriceItem {
  name: string
  note?: string
  price: string
}

const prices: PriceItem[] = [
  { name: 'Denní rybolov (8:00 – 22:00)', price: '200 Kč' },
  { name: 'Rybolov 24h (12:00 – 12:00 následujícího dne)', price: '350 Kč' },
  { name: 'Rybolov 48h (12:00 – 12:00 následujícího dne)', price: '600 Kč' },
  { name: 'VIP chata pro dva rybáře (pá 12:00 – ne 12:00)', price: '2 000 Kč' },
  { name: 'Zapůjčení podložky pod ryby', note: 'kauce 500 Kč', price: '50 Kč' },
  { name: 'Zapůjčení podběráku', note: 'kauce 300 Kč', price: '50 Kč' },
  { name: 'Zapůjčení vidliček', price: '50 Kč' },
  { name: 'Zapůjčení signalizátorů záběru', note: 'kauce 500 Kč / ks', price: '100 Kč' },
  { name: 'Zapůjčení prutů, prodej nástrah a návnad', price: 'dle aktuální nabídky' },
]

export default function PriceListPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-10">
      <div className="grid lg:grid-cols-[1fr_350px] gap-8">
        <article className="prose max-w-none prose-blue">
          <h1 className="text-4xl font-bold text-blue-700 mb-6">Ceník služeb</h1>
          <p className="lead">
            Níže uvedené ceny odpovídají oficiálnímu ceníku provozovatele k&nbsp;roku&nbsp;2025.
            Denní i&nbsp;vícedenní povolenky vyřídíte telefonicky, na&nbsp;stránce{' '}
            <Link href="/rezervovat" className="font-semibold text-semin-blue">Rezervovat</Link>, nebo přímo na&nbsp;pláži u&nbsp;rybníka
            Tomášek.
          </p>

          <div className="overflow-x-auto mt-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Služba</th>
                  <th className="px-4 py-2 text-right">Cena</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prices.map(({ name, note, price }) => (
                  <tr key={name}>
                    <td className="px-4 py-3">
                      {name}
                      {note && (
                        <span className="block text-xs text-gray-500 mt-1">{note}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap font-medium">
                      {price}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="text-2xl font-semibold text-blue-700 mt-10 mb-4">Platební možnosti</h2>
          <p>
            Zaplatit můžete hotově nebo QR platbou. Uvedené ceny zahrnují DPH.
          </p>

          <h2 className="text-2xl font-semibold text-blue-700 mt-8 mb-4">Skupinové akce</h2>
          <p>
            Chystáte závody, firemní teambuilding nebo školní výlet? Zavolejte nám na 773 291 941 a vypracujeme vám individuální nabídku.
          </p>
        </article>
        <aside className="lg:sticky lg:top-32">
          <FacebookFeed />
        </aside>
      </div>
    </main>
  )
} 