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
  ] as const

  return (
    <header className="border-b border-gray-200 bg-white sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-bold text-brand-700 text-lg">
            EvalCap
          </Link>
          <nav className="flex gap-4 text-sm">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`transition-colors ${
                  pathname === href
                    ? 'text-brand-600 font-medium'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  )
}
