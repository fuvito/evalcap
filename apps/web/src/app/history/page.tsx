import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Nav } from '@/components/nav'
import { EntryList } from './entry-list'

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
      <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">All Check-ins</h1>
          <Link
            href="/checkin"
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors whitespace-nowrap"
          >
            + New
          </Link>
        </div>

        {entries && entries.length > 0 ? (
          <EntryList entries={entries} />
        ) : (
          <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="text-3xl mb-3">📚</div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-100 mb-2">Your journal is empty</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm mb-6 max-w-sm mx-auto">
              Begin your journey by creating your first check-in. Regular reflection is the foundation of great performance reviews.
            </p>
            <Link
              href="/checkin"
              className="inline-block px-5 py-2.5 bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700 transition-colors text-sm"
            >
              Start Your First Check-in
            </Link>
          </div>
        )}
      </div>
    </>
  )
}
