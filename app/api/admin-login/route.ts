import { NextRequest, NextResponse } from 'next/server'
import { sign } from '@/lib/jwt'

// naive in-memory rate limiter (per lambda instance)
const WINDOW_MS = 15 * 60 * 1000 // 15 min
const MAX_ATTEMPTS = 5
// key => { count, first }
const attempts = new Map<string, { count: number; first: number }>()

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // clean + check window
  const entry = attempts.get(ip)
  const now = Date.now()
  if (entry) {
    if (now - entry.first > WINDOW_MS) {
      attempts.set(ip, { count: 0, first: now })
    } else if (entry.count >= MAX_ATTEMPTS) {
      return NextResponse.json({ success: false, message: 'Too many attempts. Try again later.' }, { status: 429 })
    }
  }

  try {
    const { username, password } = await req.json()
    const validUser = process.env.ADMIN_USER || 'admin'
    const validPass = process.env.ADMIN_PASS || 'password'

    const success = username === validUser && password === validPass

    if (!success) {
      // record failed attempt
      const rec = attempts.get(ip) || { count: 0, first: now }
      rec.count += 1
      attempts.set(ip, rec)
    } else {
      // reset attempts on success
      attempts.delete(ip)
    }

    if (success) {
      const secret = process.env.ADMIN_JWT_SECRET!
      const token = await sign({ user: username, exp: Math.floor(Date.now()/1000) + 60*60*24*14 }, secret)
      const res = NextResponse.json({ success: true })
      res.cookies.set('adminAuth', token, { httpOnly: true, secure: process.env.NODE_ENV==='production', path: '/', sameSite: 'lax', maxAge: 60*60*24*14 })
      return res
    }

    return NextResponse.json({ success: false, message: 'Invalid credentials' }, { status: 401 })
  } catch (e) {
    return NextResponse.json({ success: false, message: 'Bad request' }, { status: 400 })
  }
} 