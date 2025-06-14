"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      if (!res.ok) {
        throw new Error('Neplatné přihlašovací údaje')
      }
      // Force full-page navigation so that new HttpOnly cookie is available to server
      window.location.assign('/admin')
    } catch (err: any) {
      setError(err.message || 'Chyba')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen pt-20 pb-16">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-sm mx-auto">
        <h1 className="text-2xl font-bold text-semin-blue mb-6 text-center">Přihlášení správce</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="usr">Uživatelské jméno</label>
            <input id="usr" type="text" value={username} onChange={e => setUsername(e.target.value)} required className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1" htmlFor="pwd">Heslo</label>
            <input id="pwd" type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg" />
            <label className="mt-1 text-xs flex items-center"><input type="checkbox" className="mr-1" checked={showPwd} onChange={e => setShowPwd(e.target.checked)} />Zobrazit heslo</label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="w-full bg-semin-blue text-white py-2 rounded-lg hover:bg-semin-blue/90 disabled:opacity-50">{loading ? 'Přihlašuji...' : 'Přihlásit se'}</button>
        </form>
      </div>
    </main>
  )
} 