'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { href: '/o-nas', label: 'O nás' },
    { href: '/rybarsky-rad', label: 'Rybářský řád' },
    { href: '/cenik-sluzeb', label: 'Ceník služeb' },
    { href: '/galerie', label: 'Galerie' },
    { href: '/admin', label: 'Administrace' },
  ]

  return (
    <nav className="bg-white shadow-soft border-b border-gray-100 sticky top-0 z-30">
      <div className="container mx-auto px-4 2xl:max-w-7xl">
        <div className="flex items-center h-16 lg:justify-between">
          {/* Center / primary action */}
          {(() => {
            const commonRez = 'px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 lg:hidden'
            const className = pathname === '/'
              ? `${commonRez} bg-semin-blue text-white shadow-card`
              : `${commonRez} text-semin-gray hover:text-semin-blue hover:bg-semin-light-blue`
            return (
              <Link href="/" className={className}>Rezervovat</Link>
            )
          })()}

          {/* Desktop links */}
          <div className="hidden lg:flex space-x-4">
            {[{ href: '/', label: 'Rezervovat' }, ...links.filter(l => l.href !== '/admin')].map(({ href, label }) => {
              const isActive = pathname === href
              const commonBase = 'px-4 py-2 rounded-xl text-base font-medium '
              const commonFast = `${commonBase} transition-all duration-200`
              let className: string
              if (isActive) {
                className = `${commonFast} bg-semin-blue text-white shadow-card`
              } else if (href === '/') {
                className = `${commonFast} text-semin-gray hover:text-semin-blue hover:bg-semin-light-blue`
              } else {
                className = `${commonFast} text-semin-gray hover:text-semin-blue hover:bg-semin-light-blue`
              }
              return (
                <Link key={href} href={href} className={className}>
                  {label}
                </Link>
              )
            })}
          </div>

          {/* Admin link on desktop */}
          <Link
            href="/admin"
            className={`hidden lg:block px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 ml-auto ${
              pathname === '/admin'
                ? 'bg-semin-blue text-white shadow-card'
                : 'text-semin-gray hover:text-semin-blue hover:bg-semin-light-blue'
            }`}
          >
            Administrace
          </Link>

          {/* Hamburger for mobile */}
          <button
            className="lg:hidden ml-auto p-2 rounded focus:outline-none focus:ring-2 focus:ring-semin-blue"
            onClick={() => setIsOpen(true)}
            aria-label="Otevřít menu"
          >
            <svg className="w-6 h-6 text-semin-gray" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-black/40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-0 mt-4 mr-2 w-60 bg-white shadow-lg p-4 flex flex-col space-y-3 animate-slide-in rounded-2xl max-h-[90vh] overflow-y-auto">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2 rounded-xl text-base font-medium transition-all duration-200 ${
                  pathname === href
                    ? 'bg-semin-blue text-white shadow-card'
                    : 'text-semin-gray hover:text-semin-blue hover:bg-semin-light-blue'
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  )
}