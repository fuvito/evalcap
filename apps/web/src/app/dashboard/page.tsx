import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch recent entries
  const { data: recentEntries } = await supabase
    .from('journal_entries')
    .select('id, content, created_at, check_in_type')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent summaries
  const { data: recentSummaries } = await supabase
    .from('summaries')
    .select('id, timeframe_start, timeframe_end, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const isFirstTime = !recentEntries || recentEntries.length === 0

  return (
    <>
      <Nav />
      <DashboardClient isFirstTime={isFirstTime}>
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
        <Link
          href="/checkin"
          className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors whitespace-nowrap text-sm"
        >
          + New Check-in
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Total Check-ins</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {recentEntries?.length ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Summaries Generated</p>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {recentSummaries?.length ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Last Check-in</p>
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
            {recentEntries?.[0]
              ? new Date(recentEntries[0].created_at).toLocaleDateString()
              : '—'}
          </p>
        </div>
      </div>

      {/* Recent entries */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300">Recent Check-ins</h2>
          <Link href="/history" className="text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600">
            View all →
          </Link>
        </div>
        {recentEntries && recentEntries.length > 0 ? (
          <div className="space-y-2">
            {recentEntries.map(entry => (
              <div key={entry.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-brand-500 dark:text-brand-400 uppercase tracking-wide">
                    {entry.check_in_type}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-slate-500">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-slate-300 text-sm line-clamp-2">{entry.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="text-3xl mb-3">📝</div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">No check-ins yet</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Start capturing your achievements and progress. Check-ins help you reflect on your work and build material for performance reviews.
            </p>
            <Link
              href="/checkin"
              className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
            >
              Create Your First Check-in
            </Link>
          </div>
        )}
      </section>

      {/* Generate summary CTA */}
      <section className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
          Ready for your performance review?
        </h2>
        <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
          Generate an AI-powered summary from your journal entries in seconds.
        </p>
        <Link
          href="/summary"
          className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
        >
          Generate Summary
        </Link>
      </section>
    </div>
      </DashboardClient>
    </>
  )
}
