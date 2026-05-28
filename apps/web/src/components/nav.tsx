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
    { href: '/summary', label: 'Summary' },
    { href: '/summaries', label: 'Summaries' },
  ] as const

  const accountLinks = [
    { href: '/profile', label: 'Profile' },
    { href: '/settings', label: 'Settings' },
  ] as const

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-brand-700 text-lg whitespace-nowrap">
          EvalCap
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex gap-6 text-sm">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`transition-colors whitespace-nowrap ${
                pathname === href
                  ? 'text-brand-600 font-medium border-b-2 border-brand-600 pb-3'
                  : 'text-gray-600 hover:text-gray-900'
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
                    ? 'text-brand-600 font-medium'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="w-px h-6 bg-gray-200"></div>
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="absolute top-14 left-0 right-0 bg-white border-b border-gray-200 md:hidden">
            <nav className="flex flex-col p-4 gap-2">
              {links.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2 rounded transition-colors text-sm ${
                    pathname === href
                      ? 'text-brand-600 font-medium bg-blue-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <div className="border-t border-gray-200 my-2"></div>
              {accountLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-2 rounded transition-colors text-sm ${
                    pathname === href
                      ? 'text-brand-600 font-medium bg-blue-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {label}
                </Link>
              ))}
              <button
                onClick={() => {
                  handleSignOut()
                  setMenuOpen(false)
                }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded transition-colors text-left"
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
