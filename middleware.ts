import { NextRequest, NextResponse } from 'next/server'
import { verify } from '@/lib/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // protect admin dashboard and API routes starting with /api/* if needed
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('adminAuth')?.value
    const secret = process.env.ADMIN_JWT_SECRET!
    if (!token || !(await verify(token, secret))) {
      return NextResponse.rewrite(new URL('/404', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 