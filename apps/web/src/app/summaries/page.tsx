import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/nav'

export default async function SummariesPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: summaries } = await supabase
    .from('summaries')
    .select('id, timeframe_start, timeframe_end, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Nav />
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">Saved Summaries</h1>
          <Link
            href="/summary"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            + Generate New
          </Link>
        </div>

        {summaries && summaries.length > 0 ? (
          <div className="space-y-2">
            {summaries.map(summary => (
              <Link
                key={summary.id}
                href={`/summaries/${summary.id}`}
                className="block bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm hover:shadow transition-shadow"
              >
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    {new Date(summary.timeframe_start).toLocaleDateString()} – {new Date(summary.timeframe_end).toLocaleDateString()}
                  </h3>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {new Date(summary.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-slate-400">Performance review summary</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">No summaries yet</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Generate your first performance review summary from your check-ins to preserve it for later.
            </p>
            <Link
              href="/summary"
              className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
            >
              Generate Your First Summary
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
