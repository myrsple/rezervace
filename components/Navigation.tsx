'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function Navigation() {
  const pathname = usePathname()
  
  return (
    <nav className="bg-white shadow-soft border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <div className="hidden md:flex space-x-4">
              {/* Primary navigation tabs */}
              {[
                { href: '/', label: 'Rezervovat' },
                { href: '/o-nas', label: 'O nás' },
                { href: '/rybarsky-rad', label: 'Rybářský řád' },
                { href: '/cenik-sluzeb', label: 'Ceník služeb' },
                { href: '/galerie', label: 'Galerie' },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
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
          
          <div className="flex items-center">
            <Link
              href="/admin"
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                pathname === '/admin'
                  ? 'bg-semin-blue text-white shadow-card'
                  : 'text-semin-gray hover:text-semin-blue hover:bg-semin-light-blue'
              }`}
            >
              Administrace
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}