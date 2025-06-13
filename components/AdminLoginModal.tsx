"use client"

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
}

export default function AdminLoginModal({ onClose }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const [showPwd, setShowPwd] = useState(false)

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
      // success -> redirect
      router.push('/admin')
      onClose()
    } catch (err: any) {
      setError(err.message || 'Chyba přihlášení')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-11/12 max-w-sm p-6 relative animate-fade-in">
        <button
          className="absolute top-3 right-3 p-1 rounded hover:bg-gray-100"
          onClick={onClose}
          aria-label="Zavřít"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <h3 className="text-xl font-bold text-semin-blue mb-4">Přihlášení správce 🔒</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block" htmlFor="admin-usr">Uživatelské jméno</label>
            <input
              id="admin-usr"
              type="text"
              value={username}
              onChange={e=>setUsername(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 mb-1 block" htmlFor="admin-pwd">Heslo</label>
            <input
              id="admin-pwd"
              type={showPwd? 'text':'password'}
              value={password}
              onChange={e=>setPassword(e.target.value)}
              className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg"
              required
            />
            <div className="mt-1">
              <label className="text-xs flex items-center space-x-1">
                <input type="checkbox" checked={showPwd} onChange={e=>setShowPwd(e.target.checked)} className="mr-1" />
                <span>Zobrazit heslo</span>
              </label>
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-semin-blue text-white py-2 rounded-lg hover:bg-semin-blue/90 disabled:opacity-50"
          >{loading ? 'Přihlašuji...' : 'Přihlásit se'}</button>
        </form>
      </div>
    </div>
  )
} 