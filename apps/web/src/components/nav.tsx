'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useRef, useEffect } from 'react'

type Href = ComponentProps<typeof Link>['href']

const GROUPS = [
  {
    label: 'Journal',
    items: [
      { href: '/checkin',  label: 'Check-in',      desc: 'Log today\'s entry' },
      { href: '/history',  label: 'History',        desc: 'Past check-ins' },
    ],
  },
  {
    label: 'Planning',
    items: [
      { href: '/cycles', label: 'Cycles', desc: 'Performance cycles' },
      { href: '/goals',  label: 'Goals',  desc: 'Evaluation & personal goals' },
    ],
  },
  {
    label: 'Reviews',
    items: [
      { href: '/summary',    label: 'Generate',  desc: 'Create a new summary' },
      { href: '/summaries',  label: 'Saved',     desc: 'Past summaries' },
    ],
  },
] as const

const ACCOUNT_ITEMS = [
  { href: '/profile',  label: 'Profile' },
  { href: '/settings', label: 'Settings' },
  { href: '/billing',  label: 'Billing' },
  { href: '/account',  label: 'Account' },
] as const

function ChevronDown({ open }: { open: boolean }) {
  return (
    <svg
      className={`w-3.5 h-3.5 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M4 6l4 4 4-4" />
    </svg>
  )
}

function DropdownMenu({
  label,
  items,
  isOpen,
  isActive,
  onToggle,
  onClose,
}: {
  label: string
  items: readonly { href: Href; label: string; desc?: string }[]
  isOpen: boolean
  isActive: boolean
  onToggle: () => void
  onClose: () => void
}) {
  const pathname = usePathname()

  return (
    <div className="relative">
      <button
        onClick={onToggle}
        className={`flex items-center gap-1 text-sm transition-colors whitespace-nowrap py-1 ${
          isActive
            ? 'text-brand-600 dark:text-brand-400 font-medium'
            : 'text-gray-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
      >
        {label}
        <ChevronDown open={isOpen} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-44 bg-white dark:bg-slate-900 rounded-xl border border-gray-100 dark:border-slate-700 shadow-lg py-1 z-50">
          {items.map(item => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onClose}
              className={`flex flex-col px-4 py-2.5 text-sm transition-colors ${
                pathname === item.href
                  ? 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-slate-800'
                  : 'text-slate-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              <span className="font-medium">{item.label}</span>
              {'desc' in item && item.desc && (
                <span className="text-xs text-slate-400 mt-0.5">{item.desc}</span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export function Nav() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [plan, setPlan] = useState<'free' | 'pro' | null>(null)
  const navRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/plan')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.plan) setPlan(data.plan) })
      .catch(() => {})
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/auth/login')
    router.refresh()
  }

  function toggleDropdown(label: string) {
    setActiveDropdown(prev => prev === label ? null : label)
  }

  // Close dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null)
    setMobileOpen(false)
  }, [pathname])

  function isGroupActive(items: readonly { href: string }[]) {
    return items.some(item => pathname === item.href || pathname.startsWith(item.href))
  }

  return (
    <header className="border-b border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50 shadow-sm">
      <div ref={navRef} className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-brand-600 dark:text-brand-400 text-lg whitespace-nowrap shrink-0">
          EvalCap
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 mx-6">
          <Link
            href="/dashboard"
            className={`text-sm px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
              pathname === '/dashboard'
                ? 'text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-slate-800'
                : 'text-gray-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-800'
            }`}
          >
            Dashboard
          </Link>

          {GROUPS.map(group => (
            <div key={group.label} className="px-1">
              <DropdownMenu
                label={group.label}
                items={group.items}
                isOpen={activeDropdown === group.label}
                isActive={isGroupActive(group.items)}
                onToggle={() => toggleDropdown(group.label)}
                onClose={() => setActiveDropdown(null)}
              />
            </div>
          ))}
        </nav>

        {/* Desktop account dropdown + sign out */}
        <div className="hidden md:flex items-center gap-3 shrink-0">
          {plan === 'pro' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400">
              Pro
            </span>
          )}
          {plan === 'free' && (
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Free
            </span>
          )}
          <DropdownMenu
            label="Account"
            items={ACCOUNT_ITEMS}
            isOpen={activeDropdown === 'Account'}
            isActive={isGroupActive(ACCOUNT_ITEMS)}
            onToggle={() => toggleDropdown('Account')}
            onClose={() => setActiveDropdown(null)}
          />
          <div className="w-px h-5 bg-gray-200 dark:bg-slate-700" />
          <button
            onClick={handleSignOut}
            className="text-sm text-gray-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6 text-gray-600 dark:text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={mobileOpen ? 'M6 18L18 6M6 6l12 12' : 'M4 6h16M4 12h16M4 18h16'} />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <nav className="p-4 space-y-4">
            {plan && (
              <div className="flex items-center gap-2 px-4 pb-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                  plan === 'pro'
                    ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                }`}>
                  {plan === 'pro' ? 'Pro' : 'Free'}
                </span>
              </div>
            )}
            <Link
              href="/dashboard"
              onClick={() => setMobileOpen(false)}
              className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === '/dashboard'
                  ? 'text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-slate-800'
                  : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
              }`}
            >
              Dashboard
            </Link>

            {[...GROUPS, { label: 'Account', items: ACCOUNT_ITEMS }].map(group => (
              <div key={group.label}>
                <p className="px-4 pb-1 text-xs font-semibold text-slate-400 uppercase tracking-widest">
                  {group.label}
                </p>
                {group.items.map(item => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`block px-4 py-2.5 rounded-lg text-sm transition-colors ${
                      pathname === item.href
                        ? 'text-brand-600 dark:text-brand-400 font-medium bg-brand-50 dark:bg-slate-800'
                        : 'text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {'label' in item ? item.label : ''}
                  </Link>
                ))}
              </div>
            ))}

            <div className="border-t border-gray-100 dark:border-slate-800 pt-2">
              <button
                onClick={() => { handleSignOut(); setMobileOpen(false) }}
                className="block w-full text-left px-4 py-2.5 text-sm text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
