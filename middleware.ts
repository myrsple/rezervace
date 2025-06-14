import { NextRequest, NextResponse } from 'next/server'
import { verify } from '@/lib/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Protect admin dashboard; redirect to login if unauthenticated
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('adminAuth')?.value
    const secret = process.env.ADMIN_JWT_SECRET!
    const valid = token && await verify(token, secret)
    if (!valid) {
      return NextResponse.redirect(new URL('/admin-login', req.url))
    }
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
} 