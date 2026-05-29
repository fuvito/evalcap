import { POST } from '../summary/route'
import { makeSupabase, jsonRequest, bearerRequest } from './helpers'

jest.mock('@/lib/supabase/server')
jest.mock('@/lib/claude')
jest.mock('@/lib/rate-limit')
jest.mock('@anthropic-ai/sdk', () => ({ __esModule: true, default: jest.fn() }))

import { createClient, createClientFromToken } from '@/lib/supabase/server'
import { generateSummary } from '@/lib/claude'
import { rateLimit } from '@/lib/rate-limit'

const mockCreateClient = createClient as jest.Mock
const mockCreateClientFromToken = createClientFromToken as jest.Mock
const mockGenerateSummary = generateSummary as jest.Mock
const mockRateLimit = rateLimit as jest.Mock

const AUTHED_USER = { id: 'user-1', email: 'test@example.com' }
const ENTRIES = [
  { id: '1', content: 'Task A', created_at: '2026-05-01' },
  { id: '2', content: 'Task B', created_at: '2026-05-15' },
]

beforeEach(() => {
  mockRateLimit.mockReturnValue(null)
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
    const { NextResponse } = await import('next/server')
    mockRateLimit.mockReturnValue(NextResponse.json({ error: 'Too many requests' }, { status: 429 }))
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

  it('returns 500 when fetching journal entries fails', async () => {
    mockCreateClient.mockResolvedValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: null, error: { message: 'DB error' } },
      })
    )
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('returns 500 on unhandled error', async () => {
    mockCreateClient.mockRejectedValue(new Error('connection failed'))
    const req = jsonRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
    })
    const res = await POST(req)
    expect(res.status).toBe(500)
  })

  it('authenticates via Bearer token and returns summary', async () => {
    mockCreateClientFromToken.mockReturnValue(
      makeSupabase(AUTHED_USER, {
        journal_entries: { data: ENTRIES, error: null },
        evaluation_goals: { data: [], error: null },
        personal_goals: { data: [], error: null },
      })
    )
    const req = bearerRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
    }, 'mobile-jwt-token')
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockCreateClientFromToken).toHaveBeenCalledWith('mobile-jwt-token')
    expect(mockCreateClient).not.toHaveBeenCalled()
  })

  it('returns 401 for invalid Bearer token', async () => {
    mockCreateClientFromToken.mockReturnValue(makeSupabase(null))
    const req = bearerRequest('http://localhost/api/summary', 'POST', {
      timeframeStart: '2026-05-01',
      timeframeEnd: '2026-05-31',
    }, 'bad-token')
    const res = await POST(req)
    expect(res.status).toBe(401)
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
