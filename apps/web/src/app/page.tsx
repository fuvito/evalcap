import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'EvalCap – Performance Review Journaling for ICs',
  description: 'Five-minute weekly check-ins with AI-guided prompts. Generate an honest, polished self-review in seconds when your eval arrives.',
  keywords: ['performance review', 'self-review', 'journaling', 'AI', 'individual contributor', 'career'],
  openGraph: {
    title: 'EvalCap – Performance Review Journaling',
    description: 'Turn 5-minute weekly check-ins into polished, honest performance review summaries.',
    type: 'website',
    url: process.env.NEXT_PUBLIC_APP_URL,
  },
  alternates: {
    canonical: process.env.NEXT_PUBLIC_APP_URL,
  },
}

const steps = [
  {
    n: '1',
    title: 'Check in weekly',
    body: "Answer three AI-guided prompts about your work — what you accomplished, what you're building, and what's next. Takes about five minutes.",
  },
  {
    n: '2',
    title: 'Build your record',
    body: 'Every response is saved to your personal journal. Over time you build a detailed, searchable record of your contributions and impact.',
  },
  {
    n: '3',
    title: 'Generate your review',
    body: "Pick a timeframe, click Generate. EvalCap reads your entries and writes a polished, honest summary ready to copy into your review form.",
  },
]

const features = [
  {
    icon: '✦',
    title: 'Prompts that adapt to you',
    body: "AI-generated check-in questions are informed by your recent entries, so you're never asked the same thing twice.",
  },
  {
    icon: '◆',
    title: 'Honest, not inflated',
    body: "Summaries are compiled strictly from what you wrote. No fabrication, no exaggeration — the kind of review your manager will trust.",
  },
  {
    icon: '✎',
    title: 'Edit before you copy',
    body: "The generated summary is a starting point. Edit it directly in the app before copying to your performance system.",
  },
  {
    icon: '⟳',
    title: 'Regenerate any time',
    body: "Not happy with the output? Regenerate with different instructions, or adjust the timeframe to focus on a specific period.",
  },
  {
    icon: '◉',
    title: 'Daily and weekly modes',
    body: "Quick daily reflections or in-depth weekly reviews. Switch modes anytime — use whatever fits your rhythm.",
  },
  {
    icon: '⬇',
    title: 'Export your data',
    body: "Your data is always yours. Export everything as JSON from your account settings whenever you need it.",
  },
]

const faqs = [
  {
    q: 'Is EvalCap free?',
    a: 'Yes. EvalCap is free to use. Sign up with your email address — no credit card required.',
  },
  {
    q: 'Who can see my journal entries?',
    a: 'Only you. Entries are stored in a private database with row-level security — no one else has access, including us. Your manager cannot see anything unless you explicitly share it.',
  },
  {
    q: 'Will the AI make things up in my summary?',
    a: "No. Summaries are generated strictly from the entries you wrote. EvalCap does not embellish, exaggerate, or invent achievements. This is a core design principle — honest output protects your credibility.",
  },
  {
    q: 'Do I need to check in every day?',
    a: "Weekly check-ins are all you need. Five minutes once a week is enough to build a complete picture of your contributions over time. Daily mode is optional for people who prefer shorter, more frequent notes.",
  },
  {
    q: 'Can I use EvalCap if my company uses a specific review system?',
    a: "Yes. EvalCap generates a text summary that you copy and paste into any tool — Lattice, Workday, Google Docs, a simple email. It adapts to whatever your company uses.",
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
        <section className="max-w-5xl mx-auto px-4 md:px-8 pt-20 pb-16 text-center">
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

          {/* Product mockup */}
          <div className="mt-16 max-w-2xl mx-auto rounded-2xl border border-gray-200 dark:border-slate-700 shadow-2xl shadow-gray-200/60 dark:shadow-slate-900/60 overflow-hidden text-left">
            {/* Browser chrome */}
            <div className="bg-gray-100 dark:bg-slate-800 px-4 py-3 flex items-center gap-2 border-b border-gray-200 dark:border-slate-700">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
              <div className="w-3 h-3 rounded-full bg-green-400/80" />
              <div className="ml-3 flex-1 bg-white dark:bg-slate-700 rounded px-3 py-1 text-xs text-gray-400 dark:text-slate-500 text-center">
                evalcap.app/checkin
              </div>
            </div>
            {/* Simulated check-in UI */}
            <div className="bg-white dark:bg-slate-900 px-6 pt-6 pb-8">
              <div className="flex items-center justify-between mb-5">
                <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">Weekly check-in</span>
                <span className="text-xs text-gray-400 dark:text-slate-500 bg-gray-100 dark:bg-slate-800 rounded-full px-2.5 py-0.5">Prompt 2 of 3</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-4 leading-snug">
                What's the most impactful thing you shipped or moved forward this week?
              </p>
              <div className="bg-slate-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-5">
                Launched the redesigned onboarding flow. Reduced time-to-first-entry from 4 minutes to under 90 seconds. Collaborated with PM on metrics — approved for prod the same afternoon.
              </div>
              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-brand-600" />
                  <div className="w-2 h-2 rounded-full bg-brand-600" />
                  <div className="w-2 h-2 rounded-full bg-gray-200 dark:bg-slate-700" />
                </div>
                <button className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-xs font-medium hover:bg-brand-700 transition-colors">
                  Next prompt →
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="border-y border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { stat: '~5 min', label: 'Average weekly check-in' },
              { stat: '100%', label: 'Private — only you can see your entries' },
              { stat: 'Zero', label: 'Fabrications — only your own words' },
            ].map(item => (
              <div key={item.stat}>
                <div className="text-2xl font-bold text-brand-600 dark:text-brand-400 mb-1">{item.stat}</div>
                <div className="text-sm text-gray-500 dark:text-slate-400">{item.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Problem */}
        <section className="bg-slate-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
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
                  text: "You shipped a critical fix in February. Closed three deals in March. Mentored a new hire all spring. By November, it's all a blur.",
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

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-4 md:px-8 py-20">
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100 text-center mb-4">
            Frequently asked questions
          </h2>
          <p className="text-gray-500 dark:text-slate-400 text-center mb-12">
            Still have questions? <a href="mailto:support@evalcap.app" className="text-brand-600 dark:text-brand-400 hover:underline">Drop us a line.</a>
          </p>
          <div className="divide-y divide-gray-100 dark:divide-slate-800">
            {faqs.map(faq => (
              <details key={faq.q} className="group py-5">
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none text-sm font-semibold text-slate-800 dark:text-slate-100 hover:text-brand-600 dark:hover:text-brand-400 transition-colors">
                  {faq.q}
                  <span className="shrink-0 text-gray-400 dark:text-slate-500 group-open:rotate-45 transition-transform duration-200 text-lg leading-none">+</span>
                </summary>
                <p className="mt-3 text-sm text-gray-500 dark:text-slate-400 leading-relaxed">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-slate-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800">
          <div className="max-w-5xl mx-auto px-4 md:px-8 py-24 text-center">
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
          </div>
        </section>

      </main>

      <footer className="border-t border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400 dark:text-slate-500">
          <span>© {new Date().getFullYear()} EvalCap</span>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Terms of Service</Link>
            <a href="mailto:support@evalcap.app" className="hover:text-brand-500 dark:hover:text-brand-400 transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </div>
  )
}
