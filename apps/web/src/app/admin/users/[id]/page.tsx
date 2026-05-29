import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UserActions } from './user-actions'

export const dynamic = 'force-dynamic'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtShort(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const [
    profileResult,
    entryCountResult,
    summaryCountResult,
    creditsResult,
    recentEntriesResult,
  ] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).single(),
    admin.from('journal_entries').select('id', { count: 'exact', head: true }).eq('user_id', id),
    admin.from('summaries').select('id', { count: 'exact', head: true }).eq('user_id', id),
    admin.from('credits').select('*').eq('user_id', id).maybeSingle(),
    admin
      .from('journal_entries')
      .select('id, content, check_in_type, created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  if (profileResult.error || !profileResult.data) notFound()

  const profile = profileResult.data
  const credits = creditsResult.data
  const recentEntries = recentEntriesResult.data ?? []

  return (
    <div className="p-6">
      {/* Back + header */}
      <div className="mb-6">
        <Link
          href={{ pathname: '/admin/users' }}
          className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          ← Users
        </Link>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <h1 className="text-xl font-semibold text-slate-800 dark:text-slate-100">
            {profile.full_name ?? profile.email}
          </h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            profile.status === 'suspended'
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          }`}>
            {profile.status === 'suspended' ? 'Suspended' : 'Active'}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-1 space-y-4">
          {/* Profile info */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Profile</h2>
            <dl className="space-y-2 text-sm">
              {[
                ['Job Title',   profile.job_title ?? '—'],
                ['Department',  profile.department ?? '—'],
                ['Manager',     profile.manager_name ?? '—'],
                ['Check-in',    profile.default_check_in_type],
                ['Joined',      fmt(profile.created_at)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-slate-400 shrink-0">{label}</dt>
                  <dd className="text-slate-700 dark:text-slate-200 text-right truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Stats */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Stats</h2>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{entryCountResult.count ?? 0}</p>
                <p className="text-xs text-slate-400">Check-ins</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{summaryCountResult.count ?? 0}</p>
                <p className="text-xs text-slate-400">Summaries</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <UserActions
            userId={profile.id}
            status={profile.status}
            credits={credits ? { balance: credits.balance, allocated_per_month: credits.allocated_per_month } : null}
          />
        </div>

        {/* Right column: recent entries */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">Recent Entries</h2>
              {(entryCountResult.count ?? 0) > 5 && (
                <span className="text-xs text-slate-400">
                  {entryCountResult.count! - 5} more not shown
                </span>
              )}
            </div>
            {recentEntries.length > 0 ? (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {recentEntries.map(entry => (
                  <div key={entry.id} className="px-4 py-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-brand-500 dark:text-brand-400 uppercase tracking-wide">
                        {entry.check_in_type}
                      </span>
                      <span className="text-xs text-slate-400">{fmtShort(entry.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3">{entry.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-10 text-sm text-center text-slate-400">No entries yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
