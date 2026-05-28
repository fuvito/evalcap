'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/logger'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('React error boundary caught error', error, 'error-boundary')
  }, [error])

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-5xl font-bold text-gray-200 dark:text-slate-700">!</div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Something went wrong</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm">
          {error.message || 'An unexpected error occurred. Please try again.'}
        </p>
        {process.env.NODE_ENV === 'development' && error.digest && (
          <p className="text-xs text-gray-400 dark:text-slate-600 font-mono">Error ID: {error.digest}</p>
        )}
        <div className="flex gap-2 justify-center pt-4">
          <button
            onClick={reset}
            className="px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
          >
            Try again
          </button>
          <a
            href="/"
            className="px-6 py-2 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm"
          >
            Go home
          </a>
        </div>
      </div>
    </main>
  )
}
