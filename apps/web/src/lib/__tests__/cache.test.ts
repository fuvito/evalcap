import { getCachedDashboardData } from '@/lib/cache'
import { makeSupabase } from '@/app/api/__tests__/helpers'

jest.mock('@/lib/supabase/server')

import { createClient } from '@/lib/supabase/server'
const mockCreateClient = createClient as jest.Mock

const ENTRY = { id: 'e-1', content: 'shipped', created_at: '2026-05-01', check_in_type: 'daily' }
const CYCLE = { id: 'c-1', name: 'Q2', status: 'active' }
const GOAL = { id: 'g-1', title: 'Ship feature', status: 'in_progress' }

afterEach(() => jest.clearAllMocks())

describe('getCachedDashboardData', () => {
  it('returns dashboard data for all tables', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ id: 'user-1' }, {
        journal_entries: { count: 5, data: [ENTRY], error: null },
        summaries: { count: 2, data: [], error: null },
        performance_cycles: { count: null, data: [CYCLE], error: null },
        evaluation_goals: { count: null, data: [GOAL], error: null },
        personal_goals: { count: null, data: [], error: null },
      })
    )

    const result = await getCachedDashboardData('user-1')

    expect(result.entryCount).toBe(5)
    expect(result.summaryCount).toBe(2)
    expect(result.recentEntries).toEqual([ENTRY])
    expect(result.activeCycles).toEqual([CYCLE])
    expect(result.inProgressGoals).toEqual([GOAL])
    expect(result.highPriorityGoals).toEqual([])
  })

  it('handles nulls gracefully', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase({ id: 'user-1' }, {
        journal_entries: { count: null, data: null, error: null },
        summaries: { count: null, data: null, error: null },
        performance_cycles: { count: null, data: null, error: null },
        evaluation_goals: { count: null, data: null, error: null },
        personal_goals: { count: null, data: null, error: null },
      })
    )

    const result = await getCachedDashboardData('user-1')

    expect(result.entryCount).toBeNull()
    expect(result.summaryCount).toBeNull()
    expect(result.recentEntries).toBeNull()
  })
})
