import { getLimits, getUserPlan, checkSummaryLimit, getSubscription } from '../subscription'

jest.mock('@/lib/supabase/admin')

import { createAdminClient } from '@/lib/supabase/admin'

const mockCreateAdminClient = createAdminClient as jest.Mock

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fluent Supabase query chain that resolves to `result`. */
function makeChain(result: unknown) {
  const chain: Record<string, unknown> = {}
  const methods = [
    'from', 'select', 'eq', 'gte', 'lte', 'neq', 'in',
    'order', 'limit', 'single', 'maybeSingle', 'upsert',
  ] as const
  methods.forEach(m => { chain[m] = jest.fn(() => chain) })
  chain['then'] = (
    resolve: (v: unknown) => unknown,
    reject: (e: unknown) => unknown,
  ) => Promise.resolve(result).then(resolve, reject)
  return chain
}

/** Build a minimal admin mock where the `subscriptions` table returns `subRow`
 *  and the `summaries` table returns `{ count }`. */
function makeAdmin(
  subRow: Record<string, unknown> | null,
  summaryCount: number,
) {
  const subscriptionsChain = makeChain({ data: subRow, error: null })
  const summariesChain = makeChain({ count: summaryCount, error: null })

  return {
    from: jest.fn((table: string) => {
      if (table === 'subscriptions') return subscriptionsChain
      if (table === 'summaries') return summariesChain
      return makeChain({ data: null, error: null })
    }),
  }
}

afterEach(() => jest.clearAllMocks())

// ---------------------------------------------------------------------------
// getLimits
// ---------------------------------------------------------------------------

describe('getLimits', () => {
  afterEach(() => {
    delete process.env.FREE_SUMMARY_LIMIT
    delete process.env.PRO_SUMMARY_LIMIT
  })

  it('returns default values when env vars are not set', () => {
    const limits = getLimits()
    expect(limits.freeSummaryLimit).toBe(1)
    expect(limits.proSummaryLimit).toBe(50)
  })

  it('reads FREE_SUMMARY_LIMIT from env', () => {
    process.env.FREE_SUMMARY_LIMIT = '3'
    expect(getLimits().freeSummaryLimit).toBe(3)
  })

  it('reads PRO_SUMMARY_LIMIT from env', () => {
    process.env.PRO_SUMMARY_LIMIT = '100'
    expect(getLimits().proSummaryLimit).toBe(100)
  })
})

// ---------------------------------------------------------------------------
// getUserPlan
// ---------------------------------------------------------------------------

describe('getUserPlan', () => {
  it('returns "pro" when subscription has plan=pro and status=active', async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({ plan: 'pro', status: 'active' }, 0),
    )
    const plan = await getUserPlan('user-1')
    expect(plan).toBe('pro')
  })

  it('returns "pro" when subscription has plan=pro and status=trialing', async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({ plan: 'pro', status: 'trialing' }, 0),
    )
    const plan = await getUserPlan('user-1')
    expect(plan).toBe('pro')
  })

  it('returns "free" when subscription has plan=pro but status=past_due', async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({ plan: 'pro', status: 'past_due' }, 0),
    )
    const plan = await getUserPlan('user-1')
    expect(plan).toBe('free')
  })

  it('returns "free" when subscription has plan=pro but status=cancelled', async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({ plan: 'pro', status: 'cancelled' }, 0),
    )
    const plan = await getUserPlan('user-1')
    expect(plan).toBe('free')
  })

  it('returns "free" when no subscription row exists', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdmin(null, 0))
    const plan = await getUserPlan('user-2')
    expect(plan).toBe('free')
  })

  it('returns "free" when plan is not pro', async () => {
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({ plan: 'free', status: 'active' }, 0),
    )
    const plan = await getUserPlan('user-3')
    expect(plan).toBe('free')
  })
})

// ---------------------------------------------------------------------------
// checkSummaryLimit
// ---------------------------------------------------------------------------

describe('checkSummaryLimit', () => {
  beforeEach(() => {
    delete process.env.FREE_SUMMARY_LIMIT
    delete process.env.PRO_SUMMARY_LIMIT
  })

  it('free user under limit is allowed (defaults: limit=1, used=0)', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdmin(null, 0))
    const result = await checkSummaryLimit('user-1')
    expect(result.allowed).toBe(true)
    expect(result.plan).toBe('free')
    expect(result.limit).toBe(1)
    expect(result.used).toBe(0)
  })

  it('free user at limit is blocked (used=1, limit=1)', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdmin(null, 1))
    const result = await checkSummaryLimit('user-1')
    expect(result.allowed).toBe(false)
    expect(result.used).toBe(1)
  })

  it('pro user under limit is allowed', async () => {
    process.env.PRO_SUMMARY_LIMIT = '50'
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({ plan: 'pro', status: 'active' }, 5),
    )
    const result = await checkSummaryLimit('user-2')
    expect(result.allowed).toBe(true)
    expect(result.plan).toBe('pro')
    expect(result.limit).toBe(50)
    expect(result.used).toBe(5)
  })

  it('pro user at limit is blocked', async () => {
    process.env.PRO_SUMMARY_LIMIT = '50'
    mockCreateAdminClient.mockReturnValue(
      makeAdmin({ plan: 'pro', status: 'active' }, 50),
    )
    const result = await checkSummaryLimit('user-2')
    expect(result.allowed).toBe(false)
  })

  it('treats null count from DB as 0', async () => {
    // makeAdmin with summaryCount=0, but override chain to return null count
    const subscriptionsChain = makeChain({ data: null, error: null })
    const summariesChain = makeChain({ count: null, error: null })
    mockCreateAdminClient.mockReturnValue({
      from: jest.fn((table: string) => {
        if (table === 'subscriptions') return subscriptionsChain
        if (table === 'summaries') return summariesChain
        return makeChain({ data: null, error: null })
      }),
    })
    const result = await checkSummaryLimit('user-3')
    expect(result.used).toBe(0)
    expect(result.allowed).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// getSubscription
// ---------------------------------------------------------------------------

describe('getSubscription', () => {
  it('returns subscription data when it exists', async () => {
    const sub = {
      user_id: 'user-1',
      plan: 'pro',
      status: 'active',
      stripe_customer_id: 'cus_abc',
      stripe_subscription_id: 'sub_xyz',
    }
    mockCreateAdminClient.mockReturnValue(makeAdmin(sub, 0))
    const result = await getSubscription('user-1')
    expect(result).toEqual(sub)
  })

  it('returns null when no subscription exists', async () => {
    mockCreateAdminClient.mockReturnValue(makeAdmin(null, 0))
    const result = await getSubscription('user-99')
    expect(result).toBeNull()
  })
})
