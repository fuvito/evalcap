import { GET } from '../plan/route'
import { makeSupabase } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/subscription')

import { createClient } from '@/lib/supabase/server'
import { checkSummaryLimit } from '@/lib/subscription'

const mockCreateClient = createClient as jest.Mock
const mockCheckSummaryLimit = checkSummaryLimit as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }

afterEach(() => jest.clearAllMocks())

describe('GET /api/plan', () => {
  it('returns 401 when no user is authenticated', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const res = await GET()
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.error).toBe('Unauthorized')
  })

  it('returns 401 when auth throws an error', async () => {
    mockCreateClient.mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: new Error('token expired') }),
      },
    })
    const res = await GET()
    expect(res.status).toBe(401)
  })

  it('returns plan info for a free user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockCheckSummaryLimit.mockResolvedValue({ plan: 'free', used: 0, limit: 1, allowed: true })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan).toBe('free')
    expect(body.used).toBe(0)
    expect(body.limit).toBe(1)
  })

  it('returns plan info for a pro user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockCheckSummaryLimit.mockResolvedValue({ plan: 'pro', used: 12, limit: 50, allowed: true })
    const res = await GET()
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.plan).toBe('pro')
    expect(body.used).toBe(12)
    expect(body.limit).toBe(50)
  })

  it('calls checkSummaryLimit with the authenticated user id', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockCheckSummaryLimit.mockResolvedValue({ plan: 'free', used: 0, limit: 1, allowed: true })
    await GET()
    expect(mockCheckSummaryLimit).toHaveBeenCalledWith(AUTHED_USER.id)
  })

  it('does not expose the "allowed" field in the response', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    mockCheckSummaryLimit.mockResolvedValue({ plan: 'free', used: 0, limit: 1, allowed: false })
    const res = await GET()
    const body = await res.json()
    // The route only returns plan, used, limit — not allowed
    expect('allowed' in body).toBe(false)
  })
})
