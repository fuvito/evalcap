import Link from 'next/link'

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gray-50">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="text-6xl font-bold text-gray-300">404</div>
        <h1 className="text-2xl font-bold text-gray-800">Page not found</h1>
        <p className="text-gray-600 text-sm">The page you're looking for doesn't exist. Check the URL and try again.</p>
        <Link
          href="/"
          className="inline-block px-6 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
        >
          Go home
        </Link>
      </div>
    </main>
  )
}
