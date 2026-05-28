import { unstable_cache } from 'next/cache'
import { createAdminClient } from './supabase/admin'

export function getCachedDashboardData(userId: string) {
  return unstable_cache(
    async () => {
      const supabase = createAdminClient()

      const [
        { count: entryCount },
        { count: summaryCount },
        { data: recentEntries },
        { data: activeCycles },
        { data: inProgressGoals },
        { data: highPriorityGoals },
      ] = await Promise.all([
        supabase.from('journal_entries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('summaries').select('*', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('journal_entries').select('id, content, created_at, check_in_type').eq('user_id', userId).order('created_at', { ascending: false }).limit(3),
        supabase.from('performance_cycles').select('*').eq('user_id', userId).eq('status', 'active').order('start_date', { ascending: false }),
        supabase.from('evaluation_goals').select('*').eq('user_id', userId).in('status', ['not_started', 'in_progress']).order('created_at', { ascending: false }).limit(4),
        supabase.from('personal_goals').select('*').eq('user_id', userId).eq('status', 'active').eq('priority', 'high').order('created_at', { ascending: false }).limit(3),
      ])

      return { entryCount, summaryCount, recentEntries, activeCycles, inProgressGoals, highPriorityGoals }
    },
    [`dashboard-${userId}`],
    {
      tags: [`entries-${userId}`, `summaries-${userId}`, `cycles-${userId}`, `goals-${userId}`],
      revalidate: 3600,
    }
  )()
}
