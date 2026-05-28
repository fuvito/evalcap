import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-slate-50 dark:bg-slate-950">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-6xl font-bold text-gray-200 dark:text-slate-700">404</div>
        <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Page not found</h1>
        <p className="text-gray-500 dark:text-slate-400 text-sm">The page you're looking for doesn't exist. Check the URL and try again.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
