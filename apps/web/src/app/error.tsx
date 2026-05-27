'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('React error boundary caught error', error, 'error-boundary')
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800">Something went wrong</h1>
        <p className="text-gray-600 text-sm">{error.message || 'An unexpected error occurred. Please try again.'}</p>
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-xs text-gray-400 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-2 border border-gray-300 text-gray-600 rounded-lg font-medium hover:bg-gray-50 transition-colors"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  )
}
