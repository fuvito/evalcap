'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

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
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-6xl mx-auto px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" className="font-bold text-brand-700 text-lg whitespace-nowrap">
            EvalCap
          </Link>
          <nav className="flex gap-6 text-sm">
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
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm">
            {accountLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors whitespace-nowrap ${
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
            className="text-sm text-gray-600 hover:text-gray-900 transition-colors whitespace-nowrap"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
