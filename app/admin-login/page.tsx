import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verify } from '@/lib/jwt'
import dynamic from 'next/dynamic'

// Dynamically import the client-side form to keep this file a server component
const AdminLoginForm = dynamic(() => import('@/components/AdminLoginForm'), { ssr: false })

export default async function AdminLoginPage() {
  const token = cookies().get('adminAuth')?.value
  if (token) {
    const secret = process.env.ADMIN_JWT_SECRET || ''
    if (secret) {
      try {
        const payload = await verify(token, secret)
        if (payload) {
          redirect('/admin')
        }
      } catch {
        /* invalid token – fall through to login form */
      }
    }
  }

  // Not authenticated → render login form
  return <AdminLoginForm />
} 