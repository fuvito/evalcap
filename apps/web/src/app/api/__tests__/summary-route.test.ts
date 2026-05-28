import { POST } from '../summary/route'
import { makeSupabase, jsonRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/claude')
jest.mock('@/lib/rate-limit')
jest.mock('@anthropic-ai/sdk', () => ({ __esModule: true, default: jest.fn() }))

import { createClient } from '@/lib/supabase/server'
import { generateSummary } from '@/lib/claude'
import { checkRateLimit, getRateLimitInfo } from '@/lib/rate-limit'

const mockCreateClient = createClient as jest.Mock
const mockGenerateSummary = generateSummary as jest.Mock
const mockCheckRateLimit = checkRateLimit as jest.Mock
const mockGetRateLimitInfo = getRateLimitInfo as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const ENTRIES = [
  { id: '1', content: 'Task A', created_at: '2026-05-01' },
  { id: '2', content: 'Task B', created_at: '2026-05-15' },
]

beforeEach(() => {
  mockCheckRateLimit.mockReturnValue(true)
  mockGetRateLimitInfo.mockReturnValue({ remaining: 4, resetAt: new Date(Date.now() + 60000) })
  mockGenerateSummary.mockResolvedValue('This is my performance summary.')
})

afterEach(() => jest.clearAllMocks())

describe('POST /api/summary', () => {
  it('returns 401 when no user', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(null))
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
    })
    const res = await POST(req)
    expect(res.status).toBe(401)
  })

  it('returns 429 when rate limit exceeded', async () => {
    mockCheckRateLimit.mockReturnValue(false)
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
    })
    const res = await POST(req)
    expect(res.status).toBe(429)
  })

  it('returns 400 for invalid timeframeStart', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: 'not-a-date',
      timeframeEnd: '2026-05-31',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid timeframeEnd', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: 'bad',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when start date is after end date', async () => {
    mockCreateClient.mockResolvedValue(makeSupabase(AUTHED_USER))
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-06-01',
      timeframeEnd: '2026-05-01',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when no entries in timeframe', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: [], error: null },
        evaluation_goals: { data: [], error: null },
        personal_goals: { data: [], error: null },
      })
    )
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain('No journal entries')
  })

  it('returns summary on success', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: ENTRIES, error: null },
        evaluation_goals: { data: [], error: null },
        personal_goals: { data: [], error: null },
      })
    )
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.summary).toBe('This is my performance summary.')
    expect(body.entriesUsed).toBe(2)
  })

  it('passes userInstructions to generateSummary', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: ENTRIES, error: null },
        evaluation_goals: { data: [], error: null },
        personal_goals: { data: [], error: null },
      })
    )
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
      userInstructions: 'Focus on leadership',
    })
    await POST(req)
    expect(mockGenerateSummary).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(String),
      'Focus on leadership',
      expect.any(Object)
    )
  })
})
