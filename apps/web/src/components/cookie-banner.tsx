'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    try {
      if (!localStorage.getItem('cookie-consent')) {
        setVisible(true)
      }
    } catch {
      // localStorage unavailable
    }
  }, [])

  function accept() {
    try {
      localStorage.setItem('cookie-consent', 'accepted')
    } catch {
      // ignore
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6">
      <div className="max-w-3xl mx-auto bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg p-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <p className="flex-1 text-sm text-gray-600 dark:text-slate-300 leading-relaxed">
          We use cookies and localStorage to keep you signed in and remember your theme preference. See our{' '}
          <Link href="/privacy" className="text-brand-600 dark:text-brand-400 hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="flex-shrink-0 px-5 py-2 bg-brand-600 text-white text-sm font-medium rounded-lg hover:bg-brand-700 transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  )
}
