import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authResult = await requireAdmin()
  if (!authResult.ok) return authResult.response

  const { adminDb } = authResult
  const { id } = await params

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [total, daily, weekly, recent30, recent7, summaries, bounds] = await Promise.all([
    adminDb
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id),
    adminDb
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('check_in_type', 'daily'),
    adminDb
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .eq('check_in_type', 'weekly'),
    adminDb
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .gte('created_at', thirtyDaysAgo),
    adminDb
      .from('journal_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id)
      .gte('created_at', sevenDaysAgo),
    adminDb
      .from('summaries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', id),
    adminDb
      .from('journal_entries')
      .select('created_at')
      .eq('user_id', id)
      .order('created_at', { ascending: true })
      .limit(1),
  ])

  const firstEntryDate = bounds.data?.[0]?.created_at ?? null

  // Get last entry separately
  const { data: lastEntryData } = await adminDb
    .from('journal_entries')
    .select('created_at')
    .eq('user_id', id)
    .order('created_at', { ascending: false })
    .limit(1)

  const lastEntryDate = lastEntryData?.[0]?.created_at ?? null

  return NextResponse.json({
    total: total.count ?? 0,
    daily: daily.count ?? 0,
    weekly: weekly.count ?? 0,
    last7Days: recent7.count ?? 0,
    last30Days: recent30.count ?? 0,
    summaries: summaries.count ?? 0,
    firstEntryDate,
    lastEntryDate,
  })
}
