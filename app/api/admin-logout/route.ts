import { NextResponse } from 'next/server'

export async function POST() {
  const res = NextResponse.json({ success: true })
  // Clear both JWT and client helper cookies
  res.cookies.set('adminAuth', '', { path: '/', sameSite:'lax', maxAge: 0 })
  res.cookies.set('adminAuthClient', '', { path: '/', sameSite:'lax', maxAge: 0 })
  return res
}

// Fallback to GET for convenience
export const GET = POST 