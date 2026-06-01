import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getLimits, getSubscription } from '@/lib/subscription'
import { BillingActions } from './billing-actions'
import { Nav } from '@/components/nav'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string }>
}) {
  const { success } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const [sub, { count: summariesThisMonth }] = await Promise.all([
    getSubscription(user.id),
    supabase
      .from('summaries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', startOfMonth),
  ])

  const plan: 'free' | 'pro' =
    sub?.plan === 'pro' && (sub.status === 'active' || sub.status === 'trialing')
      ? 'pro'
      : 'free'

  const limits = getLimits()
  const limit = plan === 'pro' ? limits.proSummaryLimit : limits.freeSummaryLimit
  const used = summariesThisMonth ?? 0
  const isPro = plan === 'pro'

  return (
    <>
    <Nav />
    <div className="max-w-xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-800 mb-1">Billing</h1>
      <p className="text-sm text-slate-500 mb-8">Manage your EvalCap subscription.</p>

      {success === '1' && (
        <div className="mb-6 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-center justify-between gap-4">
          <span>You&apos;re now on the Pro plan. Thank you!</span>
          <Link href="/dashboard" className="flex-shrink-0 font-medium underline underline-offset-2 hover:text-green-900">
            Go to dashboard →
          </Link>
        </div>
      )}

      {/* Current plan */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-0.5">Current plan</p>
            <p className="text-xl font-bold text-slate-800">{isPro ? 'Pro' : 'Free'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isPro ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-600'
          }`}>
            {isPro ? 'Active' : 'Free tier'}
          </span>
        </div>

        {isPro && sub?.current_period_end && (
          <p className={`text-xs mb-4 ${sub.cancel_at_period_end ? 'text-amber-500' : 'text-slate-400'}`}>
            {sub.cancel_at_period_end
              ? `Cancels on ${fmtDate(sub.current_period_end)} — Pro access until then`
              : `Renews ${fmtDate(sub.current_period_end)}`}
          </p>
        )}

        {/* Summary usage */}
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-500 mb-1.5">
            <span>Summaries this month</span>
            <span className={used >= limit ? 'text-red-500 font-semibold' : ''}>
              {used} / {limit}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full transition-all ${used >= limit ? 'bg-red-400' : 'bg-brand-500'}`}
              style={{ width: `${Math.min(100, (used / limit) * 100)}%` }}
            />
          </div>
        </div>

        <BillingActions isPro={isPro} />
      </div>

      {/* Plan comparison */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-3 text-xs font-medium text-slate-500 uppercase tracking-wide bg-slate-50 border-b border-slate-200">
          <div className="px-4 py-2.5">Feature</div>
          <div className="px-4 py-2.5 text-center">Free</div>
          <div className="px-4 py-2.5 text-center text-brand-600">Pro</div>
        </div>
        {[
          ['Check-ins',         'Unlimited',                      'Unlimited'],
          ['AI prompts',        'Unlimited',                      'Unlimited'],
          [`Summaries / month`, `${limits.freeSummaryLimit}`,     `${limits.proSummaryLimit}`],
          ['History',           'Full access',                    'Full access'],
          ['Goals & cycles',    'Full access',                    'Full access'],
        ].map(([feature, free, pro]) => (
          <div key={feature} className="grid grid-cols-3 border-b border-slate-100 last:border-0 text-sm">
            <div className="px-4 py-3 text-slate-600">{feature}</div>
            <div className="px-4 py-3 text-center text-slate-500">{free}</div>
            <div className="px-4 py-3 text-center text-brand-700 font-medium">{pro}</div>
          </div>
        ))}
      </div>
    </div>
    </>
  )
}
