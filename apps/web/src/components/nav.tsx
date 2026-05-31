'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  const links = [
    { href: '/dashboard', label: 'Dashboard' },
    { href: '/checkin', label: 'Check-in' },
    { href: '/history', label: 'History' },
    { href: '/cycles', label: 'Cycles' },
    { href: '/goals', label: 'Goals' },
    { href: '/summary', label: 'Summary' },
    { href: '/summaries', label: 'Summaries' },
  ] as const

  const accountLinks = [
    { href: '/profile', label: 'Profile' },
    { href: '/settings', label: 'Settings' },
    { href: '/billing', label: 'Billing' },
    { href: '/account', label: 'Account' },
  ] as const

  return (
    <header className="border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-brand-600 dark:text-brand-400 text-lg whitespace-nowrap">
          EvalCap
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-5 text-sm">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`transition-colors whitespace-nowrap pb-0.5 ${
                pathname === href
                  ? 'text-brand-600 dark:text-brand-400 font-medium underline underline-offset-4 decoration-brand-500/50'
                  : 'text-gray-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop account menu */}
        <div className="hidden md:flex items-center gap-4">
          <nav className="flex gap-4 text-sm">
            {accountLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors ${
                  pathname === href
                    ? 'text-brand-600 dark:text-brand-400 font-medium'
                    : 'text-gray-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="w-px h-6 bg-gray-200 dark:bg-slate-700"></div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800 md:hidden">
            <nav className="flex flex-col p-4 gap-1">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-colors text-sm ${
                    pathname === href
                      ? 'text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-slate-800'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-gray-100 dark:border-slate-800 my-2"></div>
              {accountLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg transition-colors text-sm ${
                    pathname === href
                      ? 'text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-slate-800'
                      : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <button
                onClick={() => { handleSignOut(); setMenuOpen(false) }}
                className="px-4 py-3 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors text-left"
              >
                Sign out
              </button>
            </nav>
          </div>
        )}
      </div>
    </header>
  )
}
