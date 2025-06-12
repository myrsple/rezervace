import { NextRequest } from 'next/server'

const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://rybysemin.cz'

export async function GET(_req: NextRequest) {
  const pages = ['', '/o-nas', '/rybarsky-rad', '/cenik-sluzeb', '/galerie']
  const urls = pages
    .map(
      (path) => `<url><loc>${PUBLIC_BASE_URL}${path}</loc><changefreq>weekly</changefreq></url>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
} 