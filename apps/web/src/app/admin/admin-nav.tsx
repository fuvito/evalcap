'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/admin/users',  label: 'Users' },
  { href: '/admin/health', label: 'Health' },
  { href: '/admin/audit',  label: 'Audit Log' },
]

export function AdminNav() {
  const pathname = usePathname()
  return (
    <nav className="space-y-0.5">
      {links.map(({ href, label }) => (
        <Link
          key={href}
          href={{ pathname: href }}
          className={`block px-3 py-2 rounded-md text-sm font-medium transition-colors ${
            pathname.startsWith(href)
              ? 'bg-slate-700 text-white'
              : 'text-slate-400 hover:bg-slate-700 hover:text-white'
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  )
}
