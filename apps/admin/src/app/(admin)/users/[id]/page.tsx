import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { UserActions } from './user-actions'
import { EntryStats } from './entry-stats'

export const dynamic = 'force-dynamic'

function fmt(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default async function UserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const admin = createAdminClient()

  const [profileResult, creditsResult] = await Promise.all([
    admin.from('profiles').select('*').eq('id', id).single(),
    admin.from('credits').select('*').eq('user_id', id).maybeSingle(),
  ])

  if (profileResult.error || !profileResult.data) notFound()

  const profile = profileResult.data
  const credits = creditsResult.data

  return (
    <div className="p-6">
      <div className="mb-6">
        <Link href="/users" className="text-sm text-slate-400 hover:text-slate-600 transition-colors">
          ← Users
        </Link>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <h1 className="text-xl font-semibold text-slate-800">
            {profile.full_name ?? profile.email}
          </h1>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
            profile.status === 'suspended'
              ? 'bg-red-100 text-red-700'
              : 'bg-green-100 text-green-700'
          }`}>
            {profile.status === 'suspended' ? 'Suspended' : 'Active'}
          </span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{profile.email}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-slate-200 p-4">
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Profile</h2>
            <dl className="space-y-2 text-sm">
              {([
                ['Job Title',  profile.job_title ?? '—'],
                ['Department', profile.department ?? '—'],
                ['Manager',    profile.manager_name ?? '—'],
                ['Check-in',   profile.default_check_in_type],
                ['Joined',     fmt(profile.created_at)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label} className="flex justify-between gap-2">
                  <dt className="text-slate-400 shrink-0">{label}</dt>
                  <dd className="text-slate-700 text-right truncate">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <EntryStats userId={profile.id} />
        </div>

        <div className="space-y-4">
          <UserActions
            userId={profile.id}
            status={profile.status}
            credits={credits ? { balance: credits.balance, allocated_per_month: credits.allocated_per_month } : null}
          />
        </div>
      </div>
    </div>
  )
}
