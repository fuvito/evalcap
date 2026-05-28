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
      <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand-700">Dashboard</h1>
        <Link
          href="/checkin"
          className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
        >
          + New Check-in
        </Link>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Total Check-ins</p>
          <p className="text-3xl font-bold text-brand-700">
            {recentEntries?.length ?? 0}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Summaries Generated</p>
          <p className="text-3xl font-bold text-brand-700">
            {recentSummaries?.length ?? 0}
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-sm text-gray-500">Last Check-in</p>
          <p className="text-lg font-semibold text-gray-700">
            {recentEntries?.[0]
              ? new Date(recentEntries[0].created_at).toLocaleDateString()
              : 'Never'}
          </p>
        </div>
      </div>

      {/* Recent entries */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Recent Check-ins</h2>
          <Link href="/history" className="text-sm text-brand-500 hover:underline">
            View all →
          </Link>
        </div>
        {recentEntries && recentEntries.length > 0 ? (
          <div className="space-y-3">
            {recentEntries.map(entry => (
              <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">
                    {entry.check_in_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-gray-700 line-clamp-2">{entry.content}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-brand-50 to-gray-50 rounded-xl border border-brand-100">
            <div className="text-4xl mb-3">📝</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No check-ins yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Start capturing your achievements and progress. Check-ins help you reflect on your work and build material for performance reviews.
            </p>
            <Link
              href="/checkin"
              className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              + Create Your First Check-in
            </Link>
          </div>
        )}
      </section>

      {/* Generate summary CTA */}
      <section className="bg-brand-50 border border-brand-100 rounded-xl p-6">
        <h2 className="text-xl font-semibold text-brand-700 mb-2">
          Ready for your performance review?
        </h2>
        <p className="text-gray-600 mb-4">
          Generate an AI-powered summary from your journal entries in seconds.
        </p>
        <Link
          href="/summary"
          className="inline-block px-5 py-2.5 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
        >
          Generate Summary
        </Link>
      </section>
    </div>
      </DashboardClient>
    </>
  )
}
