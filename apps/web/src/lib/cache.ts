import { createClient } from './supabase/server'
import { calculateStreak } from './streak'

export async function getCachedDashboardData(userId: string) {
  const supabase = await createClient()

  const [
    { count: entryCount },
    { count: summaryCount },
    { data: recentEntries },
    { data: activeCycles },
    { data: inProgressGoals },
    { data: highPriorityGoals },
    { data: allEntryDates },
  ] = await Promise.all([
    supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('summaries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('journal_entries').select('id, content, created_at, check_in_type').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
    supabase.from('performance_cycles').select('*').eq('user_id', userId).eq('status', 'active').order('start_date', { ascending: false }),
    supabase.from('evaluation_goals').select('*').eq('user_id', userId).in('status', ['not_started', 'in_progress']).order('created_at', { ascending: false }).limit(4),
    supabase.from('personal_goals').select('*').eq('user_id', userId).eq('status', 'active').eq('priority', 'high').order('created_at', { ascending: false }).limit(3),
    supabase.from('journal_entries').select('created_at').eq('user_id', userId),
  ])

  const { streak, checkedInThisWeek } = calculateStreak(
    (allEntryDates ?? []).map(e => e.created_at)
  )

  return { entryCount, summaryCount, recentEntries, activeCycles, inProgressGoals, highPriorityGoals, streak, checkedInThisWeek }
}
