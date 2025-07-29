import { NextResponse } from 'next/server'

export const runtime = 'edge'

export function GET() {
  const body = `User-agent: *\nAllow: /\nSitemap: https://rybysemin.cz/sitemap.xml`
  return new NextResponse(body, {
    headers: {
      'content-type': 'text/plain',
    },
  })
} 