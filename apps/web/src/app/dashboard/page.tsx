import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { DashboardClient } from './dashboard-client'

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCycleDate(d: string) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch all data in parallel
  const [
    { count: entryCount },
    { count: summaryCount },
    { data: recentEntries },
    { data: activeCycles },
    { data: inProgressGoals },
    { data: highPriorityGoals },
  ] = await Promise.all([
    supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('summaries').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('journal_entries').select('id, content, created_at, check_in_type').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
    supabase.from('performance_cycles').select('*').eq('user_id', user.id).eq('status', 'active').order('start_date', { ascending: false }),
    supabase.from('evaluation_goals').select('*').eq('user_id', user.id).in('status', ['not_started', 'in_progress']).order('created_at', { ascending: false }).limit(4),
    supabase.from('personal_goals').select('*').eq('user_id', user.id).eq('status', 'active').eq('priority', 'high').order('created_at', { ascending: false }).limit(3),
  ])

  const isFirstTime = !entryCount || entryCount === 0

  const EVAL_STATUS_COLORS: Record<string, string> = {
    not_started: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400',
    in_progress: 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400',
  }

  return (
    <>
      <Nav />
      <DashboardClient isFirstTime={isFirstTime}>
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-800 dark:text-slate-100">Dashboard</h1>
            <Link
              href="/checkin"
              className="px-4 py-2 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
            >
              + New Check-in
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Total Check-ins</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{entryCount ?? 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Summaries Saved</p>
              <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{summaryCount ?? 0}</p>
            </div>
            <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-5 shadow-sm col-span-2 md:col-span-1">
              <p className="text-xs font-medium text-gray-400 dark:text-slate-500 uppercase tracking-wide mb-1">Last Check-in</p>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                {recentEntries?.[0] ? formatDate(recentEntries[0].created_at) : '—'}
              </p>
            </div>
          </div>

          {/* Active cycles */}
          {activeCycles && activeCycles.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300">Active Cycles</h2>
                <Link href="/cycles" className="text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">
                  Manage →
                </Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeCycles.map(cycle => (
                  <div key={cycle.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">{cycle.name}</p>
                      <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5">
                        {formatCycleDate(cycle.start_date)} – {formatCycleDate(cycle.end_date)}
                      </p>
                    </div>
                    <Link
                      href={`/summary?start=${cycle.start_date}&end=${cycle.end_date}`}
                      className="flex-shrink-0 text-xs px-3 py-1.5 bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors font-medium"
                    >
                      Generate →
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Goals at a glance */}
          {((inProgressGoals && inProgressGoals.length > 0) || (highPriorityGoals && highPriorityGoals.length > 0)) && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300">Goals</h2>
                <Link href="/goals" className="text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">
                  View all →
                </Link>
              </div>
              <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl shadow-sm divide-y divide-gray-100 dark:divide-slate-700">
                {inProgressGoals?.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{goal.title}</p>
                    <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${EVAL_STATUS_COLORS[goal.status] ?? ''}`}>
                      {goal.status === 'in_progress' ? 'In progress' : 'Not started'}
                    </span>
                  </div>
                ))}
                {highPriorityGoals?.map(goal => (
                  <div key={goal.id} className="flex items-center justify-between gap-3 px-4 py-3">
                    <p className="text-sm text-slate-700 dark:text-slate-200 truncate">{goal.title}</p>
                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400">
                      High priority
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recent check-ins */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-slate-700 dark:text-slate-300">Recent Check-ins</h2>
              {(entryCount ?? 0) > 3 && (
                <Link href="/history" className="text-sm text-brand-500 dark:text-brand-400 hover:text-brand-600 dark:hover:text-brand-300">
                  View all →
                </Link>
              )}
            </div>
            {recentEntries && recentEntries.length > 0 ? (
              <div className="space-y-2">
                {recentEntries.map(entry => (
                  <div key={entry.id} className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-medium text-brand-500 dark:text-brand-400 uppercase tracking-wide">
                        {entry.check_in_type}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-slate-500">
                        {formatDate(entry.created_at)}
                      </span>
                    </div>
                    <p className="text-gray-600 dark:text-slate-300 text-sm line-clamp-2">{entry.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">No check-ins yet</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                  Start capturing your work. Check-ins build the material for your next performance review.
                </p>
                <Link
                  href="/checkin"
                  className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
                >
                  Create your first check-in
                </Link>
              </div>
            )}
          </section>

          {/* Generate summary CTA — only when no active cycles (cycles section already has shortcuts) */}
          {(!activeCycles || activeCycles.length === 0) && (entryCount ?? 0) > 0 && (
            <section className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 rounded-xl p-6 shadow-sm">
              <h2 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-1">
                Ready for your performance review?
              </h2>
              <p className="text-gray-500 dark:text-slate-400 text-sm mb-4">
                Generate an AI-powered summary from your journal entries.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/summary" className="px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm">
                  Generate Summary
                </Link>
                <Link href="/cycles" className="px-5 py-2.5 border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors text-sm">
                  Set up a cycle first
                </Link>
              </div>
            </section>
          )}

        </div>
      </DashboardClient>
    </>
  )
}
