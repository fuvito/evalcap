import Link from 'next/link'
import type { Metadata } from 'next'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'EvalCap – Performance Review Journaling',
  description: 'Smart daily and weekly check-ins with AI-powered summaries. Never struggle to write a self-review again.',
  openGraph: {
    title: 'EvalCap – Performance Review Journaling',
    description: 'Turn 5-minute weekly check-ins into polished, honest performance review summaries.',
    type: 'website',
  },
}

const steps = [
  {
    n: '1',
    title: 'Check in weekly',
    body: 'Answer three AI-guided prompts about your work — what you accomplished, what you\'re building, and what\'s next. Takes about five minutes.',
  },
  {
    n: '2',
    title: 'Build your record',
    body: 'Every response is saved to your personal journal. Over time you build a detailed, searchable record of your contributions and impact.',
  },
  {
    n: '3',
    title: 'Generate your review',
    body: 'Pick a timeframe, click Generate. EvalCap reads your entries and writes a polished, honest summary ready to copy into your review form.',
  },
]

const features = [
  {
    icon: '✦',
    title: 'Prompts that adapt to you',
    body: 'AI-generated check-in questions are informed by your recent entries, so you\'re never asked the same thing twice.',
  },
  {
    icon: '◆',
    title: 'Honest, not inflated',
    body: 'Summaries are compiled strictly from what you wrote. No fabrication, no exaggeration — the kind of review your manager will trust.',
  },
  {
    icon: '✎',
    title: 'Edit before you copy',
    body: 'The generated summary is a starting point. Edit it directly in the app before copying to your performance system.',
  },
  {
    icon: '⟳',
    title: 'Regenerate any time',
    body: 'Not happy with the output? Regenerate with different instructions, or adjust the timeframe to focus on a specific period.',
  },
  {
    icon: '◉',
    title: 'Daily and weekly modes',
    body: 'Quick daily reflections or in-depth weekly reviews. Switch modes anytime — use whatever fits your rhythm.',
  },
  {
    icon: '⬇',
    title: 'Export your data',
    body: 'Your data is always yours. Export everything as JSON from your account settings whenever you need it.',
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col">

      {/* Nav */}
      <header className="border-b border-gray-100 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 md:px-8 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-brand-600 dark:text-brand-400 text-lg">
            EvalCap
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm text-gray-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/signup"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 pt-20 pb-24 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-50 dark:bg-slate-800 border border-brand-100 dark:border-slate-700 rounded-full px-4 py-1.5 text-xs font-medium text-brand-600 dark:text-brand-400 mb-8">
            AI-powered · Free to start · No credit card
          </div>

          <h1 className="text-4xl md:text-6xl font-semibold text-slate-900 dark:text-slate-50 leading-tight tracking-tight max-w-3xl mx-auto">
            Your performance review,{' '}
            <span className="text-brand-600 dark:text-brand-400">already written</span>
          </h1>

          <p className="mt-6 text-lg md:text-xl text-gray-500 dark:text-slate-400 max-w-xl mx-auto leading-relaxed">
            Five-minute weekly check-ins. An honest, polished self-review when you need it. EvalCap makes sure you never forget what you accomplished.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/auth/signup"
              className="px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
            >
              Start for free
            </Link>
            <Link
              href="/auth/login"
              className="px-8 py-3 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-sm"
            >
              Sign in
            </Link>
          </div>
        </section>

        {/* Problem */}
        <section className="bg-slate-50 dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100 text-center mb-4">
              The self-review problem
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-center max-w-lg mx-auto mb-12">
              Most people sit down to write their review and realize they can barely remember what they did six months ago.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  heading: 'Memory fades fast',
                  text: 'You shipped a critical fix in February. Closed three deals in March. Mentored a new hire all spring. By November, it\'s all a blur.',
                },
                {
                  heading: 'One-sided picture',
                  text: 'Without notes, you only remember the loud wins — and miss the steady, high-value work that actually drives performance.',
                },
                {
                  heading: 'Hours lost writing',
                  text: 'Trying to reconstruct months of work from memory, Slack history, and commit logs is exhausting and error-prone.',
                },
              ].map(item => (
                <div key={item.heading} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{item.heading}</h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{item.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 py-20">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100 text-center mb-4">
            How EvalCap works
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-center max-w-md mx-auto mb-14">
            A simple loop that takes minutes a week and saves hours at review time.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map(step => (
              <div key={step.n} className="relative">
                <div className="w-10 h-10 rounded-full bg-brand-600 text-white flex items-center justify-center text-sm font-bold mb-4">
                  {step.n}
                </div>
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section className="bg-slate-50 dark:bg-slate-900 border-y border-gray-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-20">
            <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100 text-center mb-4">
              Built for individual contributors
            </h2>
            <p className="text-gray-500 dark:text-slate-400 text-center max-w-md mx-auto mb-14">
              Everything you need to capture your work honestly and present it confidently.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {features.map(f => (
                <div key={f.title} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 shadow-sm">
                  <div className="text-brand-500 dark:text-brand-400 text-lg mb-3 font-bold">{f.icon}</div>
                  <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">{f.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed">{f.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-5xl mx-auto px-4 md:px-8 py-24 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-slate-800 dark:text-slate-100 mb-4">
            Start building your record today
          </h2>
          <p className="text-gray-500 dark:text-slate-400 max-w-md mx-auto mb-10">
            Your next review is closer than you think. Five minutes a week is all it takes.
          </p>
          <Link
            href="/auth/signup"
            className="inline-block px-10 py-3.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors"
          >
            Get started free
          </Link>
          <p className="text-xs text-gray-400 dark:text-slate-600 mt-4">No credit card required</p>
        </section>

      </main>

      <Footer />
    </div>
  )
}
