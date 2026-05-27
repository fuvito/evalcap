import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/nav'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, content, check_in_type, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <>
      <Nav />
      <div className="max-w-2xl mx-auto p-8 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-brand-700">All Check-ins</h1>
          <Link
            href="/checkin"
            className="px-4 py-2 bg-brand-500 text-white rounded-lg text-sm font-medium hover:bg-brand-600 transition-colors"
          >
            + New
          </Link>
        </div>

        {entries && entries.length > 0 ? (
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">
                    {entry.check_in_type}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(entry.created_at).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
                <p className="text-gray-700 text-sm whitespace-pre-line line-clamp-4">
                  {entry.content}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-gray-50 rounded-xl">
            <p className="text-gray-500 mb-4">No check-ins yet.</p>
            <Link href="/checkin" className="text-brand-500 font-medium hover:underline">
              Start your first check-in →
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
