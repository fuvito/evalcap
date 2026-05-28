import Link from 'next/link'

const features = [
  {
    title: 'Guided Check-ins',
    description: 'AI-generated prompts for daily and weekly reflections, tailored to surface your real impact.',
  },
  {
    title: 'Automatic Journal',
    description: 'Every response is saved and organized. Build a rich record of your work over time.',
  },
  {
    title: 'AI-Powered Summaries',
    description: 'Select any timeframe and get a polished, honest performance review summary in seconds.',
  },
]

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        <div className="max-w-2xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="inline-block text-brand-600 dark:text-brand-400 font-bold text-lg tracking-tight">
              EvalCap
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-800 dark:text-slate-100 leading-tight">
              Turn your daily wins into<br className="hidden md:block" /> performance review gold
            </h1>
            <p className="text-lg text-gray-500 dark:text-slate-400 max-w-lg mx-auto">
              Smart journal check-ins and AI-powered summaries so you never struggle to write a self-review again.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="px-6 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
            >
              Get started free
            </Link>
            <Link
              href="/auth/login"
              className="px-6 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-white dark:hover:bg-slate-800 transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            {features.map(f => (
              <div key={f.title} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 text-left shadow-sm">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1">{f.title}</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="py-6 text-center text-xs text-gray-400 dark:text-slate-600">
        © {new Date().getFullYear()} EvalCap
      </footer>
    </main>
  )
}
