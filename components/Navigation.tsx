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
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-3">
              <div className="text-2xl font-bold text-semin-blue">
                Ryby Semín
              </div>
              <div className="hidden sm:block text-sm text-semin-gray font-medium">
                Sportovní rybolov s občerstvením
              </div>
            </Link>
            
            <div className="hidden md:flex space-x-4">
              <Link 
                href="/" 
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  pathname === '/' 
                    ? 'bg-semin-blue text-white shadow-card' 
                    : 'text-semin-gray hover:text-semin-blue hover:bg-semin-light-blue'
                }`}
              >
                Rezervovat
              </Link>
              
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
          
          <div className="flex items-center">
            <span className="text-sm text-semin-gray font-medium">
              {pathname === '/admin' ? 'Administrace systému' : 'Rezervace lovných míst'}
            </span>
          </div>
        </div>
      </div>
    </nav>
  )
} 