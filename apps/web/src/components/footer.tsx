import Link from 'next/link'

export function Footer() {
  return (
    <footer className="border-t border-gray-100 dark:border-slate-800 mt-auto py-6">
      <div className="max-w-5xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400 dark:text-slate-500">
        <span>© {new Date().getFullYear()} EvalCap</span>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">
            Terms of Service
          </Link>
        </nav>
      </div>
    </footer>
  )
}
