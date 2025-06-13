'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error)
  }, [error])

  // Check if it's the Brave extension error
  const isBraveExtensionError = error.message === '"undefined" is not valid JSON' && 
    error.stack?.includes('frame_ant.js')

  if (isBraveExtensionError) {
    return (
      <div className="min-h-[400px] flex items-center justify-center p-8">
        <div className="max-w-md text-center">
          <div className="mb-4 text-amber-500">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Upozornění pro Brave</h2>
          <p className="text-gray-600 mb-4">
            Vypadá to, že používáš Brave! Některé funkce prohlížeče mohou ukazovat bezpečné chyby, ale vše funguje dobře.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Pokud chceš tyto chyby skrýt, můžeš dočasně zakázat Brave Shieldy pro tuto stránku.
          </p>
          <div className="space-x-4">
            <button
              onClick={() => reset()}
              className="bg-semin-blue text-white px-4 py-2 rounded-lg hover:bg-semin-blue/90 transition-colors"
            >
              Zkusit znovu
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="text-semin-blue hover:text-semin-blue/90 transition-colors"
            >
              Zpět na úvod
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-[400px] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <div className="mb-4 text-red-500">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Něco se pokazilo!</h2>
        <p className="text-gray-600 mb-6">
          Vyskytla se neočekávaná chyba. Prosím, zkuste to znovu nebo kontaktujte podporu, pokud problém přetrvává.
        </p>
        <div className="space-x-4">
          <button
            onClick={() => reset()}
            className="bg-semin-blue text-white px-4 py-2 rounded-lg hover:bg-semin-blue/90 transition-colors"
          >
            Zkusit znovu
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="text-semin-blue hover:text-semin-blue/90 transition-colors"
          >
            Zpět na úvod
          </button>
        </div>
      </div>
    </div>
  )
} 