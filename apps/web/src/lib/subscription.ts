import { createAdminClient } from '@/lib/supabase/admin'

export type Plan = 'free' | 'pro'

export function getLimits() {
  return {
    freeSummaryLimit: parseInt(process.env.FREE_SUMMARY_LIMIT ?? '1', 10),
    proSummaryLimit:  parseInt(process.env.PRO_SUMMARY_LIMIT  ?? '50', 10),
  }
}

export async function getUserPlan(userId: string): Promise<Plan> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', userId)
    .maybeSingle()

  if (data?.plan === 'pro' && (data.status === 'active' || data.status === 'trialing')) {
    return 'pro'
  }
  return 'free'
}

export async function checkSummaryLimit(userId: string): Promise<{
  allowed: boolean
  used: number
  limit: number
  plan: Plan
}> {
  const [plan, adminDb] = await Promise.all([
    getUserPlan(userId),
    Promise.resolve(createAdminClient()),
  ])

  const limits = getLimits()
  const limit = plan === 'pro' ? limits.proSummaryLimit : limits.freeSummaryLimit

  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count } = await adminDb
    .from('summaries')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfMonth.toISOString())

  const used = count ?? 0
  return { allowed: used < limit, used, limit, plan }
}

export async function getSubscription(userId: string) {
  const admin = createAdminClient()
  const { data } = await admin
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data
}
