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
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-brand-700">Saved Summaries</h1>
          <Link
            href="/summary"
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            + Generate New
          </Link>
        </div>

        {summaries && summaries.length > 0 ? (
          <div className="space-y-3">
            {summaries.map(summary => (
              <Link
                key={summary.id}
                href={`/summaries/${summary.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-brand-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">
                    {new Date(summary.timeframe_start).toLocaleDateString()} to{' '}
                    {new Date(summary.timeframe_end).toLocaleDateString()}
                  </h3>
                  <span className="text-xs text-gray-400">
                    {new Date(summary.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Performance review summary for {summary.timeframe_start}–{summary.timeframe_end}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gradient-to-br from-brand-50 to-gray-50 rounded-xl border border-brand-100">
            <div className="text-4xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No summaries yet</h3>
            <p className="text-gray-600 mb-6 max-w-sm mx-auto">
              Generate your first performance review summary from your check-ins to preserve it for later.
            </p>
            <Link
              href="/summary"
              className="inline-block px-6 py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
            >
              Generate Your First Summary
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
